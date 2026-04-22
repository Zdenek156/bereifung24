/**
 * IMAP-Polling für die "partner@bereifung24.de"-Inbox.
 *
 * Verwendet `node-imap` + `mailparser`.
 * - Holt UNSEEN Mails (alternativ: alle aus den letzten 7 Tagen)
 * - Matched eingehende Replies via `In-Reply-To` / `References` Header
 *   gegen ProspectOutreachEmail.messageId
 * - Erzeugt für jede Reply eine neue ProspectOutreachEmail (direction=INBOUND, status=RECEIVED)
 * - Markiert die zugehörige OUTBOUND-Email als beantwortet (repliedAt)
 * - Markiert verarbeitete Mails als \\Seen
 *
 * Wird vom Cron-Endpoint /api/cron/sales/sync-inbox aufgerufen.
 */
import Imap from 'node-imap'
import { simpleParser, ParsedMail } from 'mailparser'
import { prisma } from '@/lib/prisma'
import { getOutreachImapConfig, generateMessageId } from './outreachMailer'

interface SyncResult {
  fetched: number
  matched: number
  inserted: number
  skipped: number
  errors: string[]
}

function normalizeMessageId(id?: string | null): string | null {
  if (!id) return null
  const trimmed = id.trim()
  if (!trimmed) return null
  return trimmed.startsWith('<') ? trimmed : `<${trimmed}>`
}

function extractReferences(parsed: ParsedMail): string[] {
  const refs: string[] = []
  const inReply = normalizeMessageId(parsed.inReplyTo as any)
  if (inReply) refs.push(inReply)
  const refField = (parsed.references as any) || []
  if (Array.isArray(refField)) {
    for (const r of refField) {
      const n = normalizeMessageId(r)
      if (n) refs.push(n)
    }
  } else if (typeof refField === 'string') {
    for (const r of refField.split(/\s+/)) {
      const n = normalizeMessageId(r)
      if (n) refs.push(n)
    }
  }
  return Array.from(new Set(refs))
}

function fetchAll(imap: Imap, criteria: any[]): Promise<Buffer[]> {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (searchErr, uids) => {
      if (searchErr) return reject(searchErr)
      if (!uids || !uids.length) return resolve([])

      // Maximal 100 Mails pro Lauf
      const limited = uids.slice(-100)
      const buffers: Buffer[] = []
      const f = imap.fetch(limited, { bodies: '', markSeen: true })

      f.on('message', (msg) => {
        const chunks: Buffer[] = []
        msg.on('body', (stream) => {
          stream.on('data', (c: Buffer) => chunks.push(c))
          stream.on('end', () => buffers.push(Buffer.concat(chunks)))
        })
      })
      f.once('error', reject)
      f.once('end', () => resolve(buffers))
    })
  })
}

function openInbox(imap: Imap): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', false, (err) => (err ? reject(err) : resolve()))
  })
}

function connectImap(imap: Imap): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.once('ready', () => resolve())
    imap.once('error', reject)
    imap.connect()
  })
}

function endImap(imap: Imap): Promise<void> {
  return new Promise((resolve) => {
    try {
      imap.once('end', () => resolve())
      imap.end()
    } catch {
      resolve()
    }
  })
}

export async function syncOutreachInbox(): Promise<SyncResult> {
  const result: SyncResult = { fetched: 0, matched: 0, inserted: 0, skipped: 0, errors: [] }
  const cfg = await getOutreachImapConfig()
  if (!cfg) {
    result.errors.push('OUTREACH_IMAP_PASSWORD nicht gesetzt.')
    return result
  }

  const imap = new Imap({
    user: cfg.user,
    password: cfg.password,
    host: cfg.host,
    port: cfg.port,
    tls: cfg.tls,
    tlsOptions: { rejectUnauthorized: true, servername: cfg.host },
    authTimeout: 15_000,
    connTimeout: 15_000,
  })

  try {
    await connectImap(imap)
    await openInbox(imap)
    // UNSEEN = nur neue
    const buffers = await fetchAll(imap, ['UNSEEN'])
    result.fetched = buffers.length

    for (const buf of buffers) {
      try {
        const parsed = await simpleParser(buf)
        const incomingMessageId =
          normalizeMessageId(parsed.messageId) ||
          generateMessageId() // synthetisch falls fehlt

        // Doppelten Insert vermeiden
        const exists = await prisma.prospectOutreachEmail.findUnique({
          where: { messageId: incomingMessageId },
        })
        if (exists) {
          result.skipped++
          continue
        }

        // Threading: erste passende OUTBOUND finden
        const refs = extractReferences(parsed)
        let matchedOutbound = null as null | {
          id: string
          prospectId: string
          threadId: string | null
          messageId: string
        }
        if (refs.length) {
          matchedOutbound = await prisma.prospectOutreachEmail.findFirst({
            where: {
              direction: 'OUTBOUND',
              messageId: { in: refs },
            },
            select: { id: true, prospectId: true, threadId: true, messageId: true },
          })
        }

        // Fallback: über Sender-Email auf Prospect matchen
        let prospectId = matchedOutbound?.prospectId || null
        const fromAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase()
        if (!prospectId && fromAddr) {
          const pr = await prisma.prospectWorkshop.findFirst({
            where: { email: { equals: fromAddr, mode: 'insensitive' } },
            select: { id: true },
          })
          if (pr) prospectId = pr.id
        }

        if (!prospectId) {
          // Keine Zuordnung möglich – überspringen (z.B. Mailer-Daemon, Spam)
          result.skipped++
          continue
        }

        const subject = (parsed.subject || '(kein Betreff)').slice(0, 500)
        const text = (parsed.text || parsed.html?.toString() || '').slice(0, 30_000)
        const toAddr =
          (parsed.to as any)?.value?.[0]?.address ||
          cfg.user
        const threadId = matchedOutbound?.threadId || matchedOutbound?.messageId || incomingMessageId

        await prisma.$transaction(async (tx) => {
          await tx.prospectOutreachEmail.create({
            data: {
              prospectId,
              direction: 'INBOUND',
              templateType: 'REPLY',
              fromEmail: fromAddr || 'unknown@unknown',
              toEmail: toAddr,
              subject,
              body: text,
              messageId: incomingMessageId,
              inReplyTo: refs[0] || null,
              threadId,
              status: 'RECEIVED',
              sentAt: parsed.date || new Date(),
              repliedAt: new Date(),
              aiGenerated: false,
            },
          })

          if (matchedOutbound) {
            await tx.prospectOutreachEmail.update({
              where: { id: matchedOutbound.id },
              data: { repliedAt: new Date() },
            })
          }

          await tx.prospectWorkshop.update({
            where: { id: prospectId! },
            data: { lastContactDate: new Date() },
          })
        })

        if (matchedOutbound) result.matched++
        result.inserted++
      } catch (e: any) {
        result.errors.push(`Parse/Insert-Fehler: ${e?.message || e}`)
      }
    }
  } catch (e: any) {
    result.errors.push(`IMAP-Fehler: ${e?.message || e}`)
  } finally {
    try { await endImap(imap) } catch { /* ignore */ }
  }

  return result
}
