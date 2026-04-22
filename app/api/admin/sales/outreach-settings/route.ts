import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'
import { clearApiSettingsCache } from '@/lib/api-settings'

const KEYS = [
  { key: 'OUTREACH_SMTP_HOST',     label: 'SMTP Host',          group: 'smtp', placeholder: 'mail.your-server.de', sensitive: false },
  { key: 'OUTREACH_SMTP_PORT',     label: 'SMTP Port',          group: 'smtp', placeholder: '587',                  sensitive: false },
  { key: 'OUTREACH_SMTP_USER',     label: 'SMTP Benutzer',      group: 'smtp', placeholder: 'partner@bereifung24.de', sensitive: false },
  { key: 'OUTREACH_SMTP_PASSWORD', label: 'SMTP Passwort',      group: 'smtp', placeholder: '••••••••',             sensitive: true  },
  { key: 'OUTREACH_FROM_EMAIL',    label: 'Absender-Email',     group: 'smtp', placeholder: 'partner@bereifung24.de', sensitive: false },
  { key: 'OUTREACH_FROM_NAME',     label: 'Absender-Name',      group: 'smtp', placeholder: 'Bereifung24 Partnerteam', sensitive: false },

  { key: 'OUTREACH_IMAP_HOST',     label: 'IMAP Host',          group: 'imap', placeholder: 'mail.your-server.de', sensitive: false },
  { key: 'OUTREACH_IMAP_PORT',     label: 'IMAP Port',          group: 'imap', placeholder: '993',                  sensitive: false },
  { key: 'OUTREACH_IMAP_USER',     label: 'IMAP Benutzer',      group: 'imap', placeholder: 'partner@bereifung24.de', sensitive: false },
  { key: 'OUTREACH_IMAP_PASSWORD', label: 'IMAP Passwort',      group: 'imap', placeholder: '••••••••',             sensitive: true  },
  { key: 'OUTREACH_IMAP_TLS',      label: 'IMAP TLS (true/false)', group: 'imap', placeholder: 'true',              sensitive: false },
] as const

type KeyName = typeof KEYS[number]['key']

export async function GET() {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await prisma.adminApiSetting.findMany({
    where: { key: { in: KEYS.map((k) => k.key) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value || ''

  // Maskiere Passwörter (zeige nur an, ob gesetzt)
  const fields = KEYS.map((k) => {
    const value = map[k.key] || ''
    if (k.sensitive) {
      return { ...k, value: '', isSet: !!value }
    }
    return { ...k, value, isSet: !!value }
  })

  return NextResponse.json({ fields })
}

export async function POST(req: NextRequest) {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({} as any))
  const updates = body.values || {}

  const allowed = new Set<string>(KEYS.map((k) => k.key))
  const writes: Promise<any>[] = []

  for (const [key, raw] of Object.entries(updates)) {
    if (!allowed.has(key)) continue
    const def = KEYS.find((k) => k.key === key)!
    const val = typeof raw === 'string' ? raw.trim() : ''

    // Sensitive Felder: leerer String = unverändert lassen.
    // Wer löschen will, schickt explizit "__CLEAR__".
    if (def.sensitive && val === '') continue

    const finalValue = val === '__CLEAR__' ? '' : val

    writes.push(
      prisma.adminApiSetting.upsert({
        where: { key },
        create: { key, value: finalValue, description: def.label },
        update: { value: finalValue },
      })
    )
  }

  await Promise.all(writes)
  clearApiSettingsCache()

  return NextResponse.json({ success: true, updated: writes.length })
}
