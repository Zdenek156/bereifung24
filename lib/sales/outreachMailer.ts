/**
 * Sales-Outreach-Mailer.
 * Versendet Cold-Outreach-Emails über die separate "partner@bereifung24.de"-
 * Mailbox (eigener SMTP/IMAP-Account, getrennt vom Standard-Mailer).
 *
 * Konfiguration via AdminApiSetting (oder ENV-Fallback):
 *   OUTREACH_SMTP_HOST   default: mail.your-server.de
 *   OUTREACH_SMTP_PORT   default: 587
 *   OUTREACH_SMTP_USER   default: partner@bereifung24.de
 *   OUTREACH_SMTP_PASSWORD
 *   OUTREACH_FROM_EMAIL  default: partner@bereifung24.de
 *   OUTREACH_FROM_NAME   default: Bereifung24 Partnerteam
 *
 *   OUTREACH_IMAP_HOST   default: mail.your-server.de
 *   OUTREACH_IMAP_PORT   default: 993
 *   OUTREACH_IMAP_USER   default: partner@bereifung24.de
 *   OUTREACH_IMAP_PASSWORD
 *   OUTREACH_IMAP_TLS    default: "true"
 */
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

export interface OutreachSmtpConfig {
  host: string
  port: number
  user: string
  password: string
  fromEmail: string
  fromName: string
  secure: boolean
}

export interface OutreachImapConfig {
  host: string
  port: number
  user: string
  password: string
  tls: boolean
}

const SMTP_KEYS = [
  'OUTREACH_SMTP_HOST',
  'OUTREACH_SMTP_PORT',
  'OUTREACH_SMTP_USER',
  'OUTREACH_SMTP_PASSWORD',
  'OUTREACH_FROM_EMAIL',
  'OUTREACH_FROM_NAME',
] as const
const IMAP_KEYS = [
  'OUTREACH_IMAP_HOST',
  'OUTREACH_IMAP_PORT',
  'OUTREACH_IMAP_USER',
  'OUTREACH_IMAP_PASSWORD',
  'OUTREACH_IMAP_TLS',
] as const

async function loadSettings(keys: readonly string[]): Promise<Record<string, string>> {
  const rows = await prisma.adminApiSetting.findMany({
    where: { key: { in: [...keys] } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value || ''
  for (const k of keys) {
    if (!map[k] && process.env[k]) map[k] = process.env[k] as string
  }
  return map
}

export async function getOutreachSmtpConfig(): Promise<OutreachSmtpConfig | null> {
  const s = await loadSettings(SMTP_KEYS)
  const host = s.OUTREACH_SMTP_HOST || 'mail.your-server.de'
  const portStr = s.OUTREACH_SMTP_PORT || '587'
  const user = s.OUTREACH_SMTP_USER || 'partner@bereifung24.de'
  const password = s.OUTREACH_SMTP_PASSWORD || ''
  if (!password) return null
  const port = parseInt(portStr, 10) || 587
  return {
    host,
    port,
    user,
    password,
    fromEmail: s.OUTREACH_FROM_EMAIL || user,
    fromName: s.OUTREACH_FROM_NAME || 'Bereifung24 Partnerteam',
    secure: port === 465,
  }
}

export async function getOutreachImapConfig(): Promise<OutreachImapConfig | null> {
  const s = await loadSettings(IMAP_KEYS)
  const host = s.OUTREACH_IMAP_HOST || 'mail.your-server.de'
  const portStr = s.OUTREACH_IMAP_PORT || '993'
  const user = s.OUTREACH_IMAP_USER || 'partner@bereifung24.de'
  const password = s.OUTREACH_IMAP_PASSWORD || ''
  if (!password) return null
  const port = parseInt(portStr, 10) || 993
  const tls = (s.OUTREACH_IMAP_TLS ?? 'true').toLowerCase() !== 'false'
  return { host, port, user, password, tls }
}

/**
 * Generiert eine eindeutige RFC-5322-Message-ID (Domain bereifung24.de).
 * Wird als Threading-Anker (auch für In-Reply-To) verwendet.
 */
export function generateMessageId(): string {
  const rnd = Math.random().toString(36).slice(2, 12)
  return `<${Date.now()}.${rnd}@bereifung24.de>`
}

export interface SendOutreachOptions {
  to: string
  subject: string
  text: string
  html: string
  messageId: string          // wir setzen es selbst, damit wir Replies matchen können
  inReplyTo?: string | null  // bei FOLLOWUP/REPLY: Message-ID der vorigen Mail
  references?: string[]      // gesamte Thread-Kette
  replyToOverride?: string   // optional, default = fromEmail
}

export interface SendOutreachResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendOutreachEmail(opts: SendOutreachOptions): Promise<SendOutreachResult> {
  const cfg = await getOutreachSmtpConfig()
  if (!cfg) {
    return {
      success: false,
      error:
        'OUTREACH_SMTP_PASSWORD nicht gesetzt. Bitte unter Admin → API-Einstellungen die OUTREACH_SMTP_* Keys hinterlegen.',
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.password },
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    })

    const headers: Record<string, string> = {}
    if (opts.inReplyTo) headers['In-Reply-To'] = opts.inReplyTo
    if (opts.references && opts.references.length) {
      headers['References'] = opts.references.join(' ')
    }

    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      messageId: opts.messageId,
      replyTo: opts.replyToOverride || cfg.fromEmail,
      headers,
    })

    return { success: true, messageId: info.messageId || opts.messageId }
  } catch (err: any) {
    console.error('[outreachMailer] send failed:', err?.message || err)
    return { success: false, error: err?.message || 'Unbekannter SMTP-Fehler' }
  }
}
