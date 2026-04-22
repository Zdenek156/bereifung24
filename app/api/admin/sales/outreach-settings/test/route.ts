import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import Imap from 'node-imap'
import { getSalesUser } from '@/lib/sales-auth'
import {
  getOutreachSmtpConfig,
  getOutreachImapConfig,
} from '@/lib/sales/outreachMailer'

interface TestResult {
  ok: boolean
  detail?: string
  error?: string
}

async function testSmtp(): Promise<TestResult> {
  const cfg = await getOutreachSmtpConfig()
  if (!cfg) return { ok: false, error: 'SMTP-Konfiguration unvollständig (Passwort fehlt).' }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 12_000,
    })
    await transporter.verify()
    return { ok: true, detail: `Verbunden mit ${cfg.host}:${cfg.port} als ${cfg.user}` }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'SMTP-Verbindung fehlgeschlagen' }
  }
}

function testImap(): Promise<TestResult> {
  return new Promise(async (resolve) => {
    const cfg = await getOutreachImapConfig()
    if (!cfg) return resolve({ ok: false, error: 'IMAP-Konfiguration unvollständig (Passwort fehlt).' })

    const imap = new Imap({
      user: cfg.user,
      password: cfg.password,
      host: cfg.host,
      port: cfg.port,
      tls: cfg.tls,
      tlsOptions: { rejectUnauthorized: true, servername: cfg.host },
      authTimeout: 10_000,
      connTimeout: 10_000,
    })

    let done = false
    const finish = (r: TestResult) => {
      if (done) return
      done = true
      try { imap.end() } catch { /* ignore */ }
      resolve(r)
    }

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) return finish({ ok: false, error: `INBOX nicht erreichbar: ${err.message}` })
        finish({
          ok: true,
          detail: `Verbunden mit ${cfg.host}:${cfg.port} als ${cfg.user} (${box?.messages?.total ?? 0} Nachrichten in INBOX)`,
        })
      })
    })
    imap.once('error', (err: any) => finish({ ok: false, error: err?.message || 'IMAP-Fehler' }))

    try {
      imap.connect()
    } catch (e: any) {
      finish({ ok: false, error: e?.message || 'IMAP-Connect fehlgeschlagen' })
    }

    setTimeout(() => finish({ ok: false, error: 'IMAP-Timeout (15s)' }), 15_000)
  })
}

export async function POST(req: NextRequest) {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({} as any))
  const which = String(body.which || 'both') // 'smtp' | 'imap' | 'both'

  const result: { smtp?: TestResult; imap?: TestResult } = {}
  if (which === 'smtp' || which === 'both') result.smtp = await testSmtp()
  if (which === 'imap' || which === 'both') result.imap = await testImap()

  return NextResponse.json({ success: true, ...result })
}
