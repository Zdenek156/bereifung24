import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function timeOfDayGreeting(hour: number): string {
  if (hour < 5) return 'Guten Abend'
  if (hour < 11) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? parseFloat(value) : (value as number)
  return Number.isFinite(n) ? (n as number) : null
}

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let stats: Record<string, unknown> = {}
  try {
    const body = await request.json()
    if (body && typeof body === 'object') stats = body
  } catch { /* no stats provided */ }

  // Berlin-Zeit (Server läuft UTC)
  const berlin = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
  const hour = berlin.getHours()
  const weekday = WEEKDAYS[berlin.getDay()]
  const day = berlin.getDate()
  const month = MONTHS[berlin.getMonth()]
  const year = berlin.getFullYear()

  const salutation = 'Sir'

  const greeting = timeOfDayGreeting(hour)
  // Deutsche Sprechweise: "14 Uhr 30" statt "14:30 Uhr" (TTS liest das natürlicher vor)
  const minutesNum = berlin.getMinutes()
  const timeStr = minutesNum === 0
    ? `${hour} Uhr`
    : `${hour} Uhr ${minutesNum}`

  // Karten-Daten aufbereiten
  const unread = num(stats.unreadEmails)
  const support = num(stats.newSupportRequests)
  const notActivated = num(stats.notActivatedWorkshops)
  const tasks = num(stats.pendingTasks)
  const customers = num(stats.totalCustomers)
  const workshops = num(stats.totalWorkshops)
  const commissions = num(stats.totalCommissions)

  const briefing: string[] = []
  if (unread !== null) {
    briefing.push(unread === 0 ? 'Ihr Posteingang ist leer' : pluralize(unread, 'ungelesene E-Mail', 'ungelesene E-Mails'))
  }
  if (support !== null && support > 0) {
    briefing.push(pluralize(support, 'neue Support-Anfrage', 'neue Support-Anfragen'))
  }
  if (notActivated !== null && notActivated > 0) {
    briefing.push(pluralize(notActivated, 'nicht freigeschaltete Werkstatt', 'nicht freigeschaltete Werkstätten'))
  }
  if (tasks !== null && tasks > 0) {
    briefing.push(pluralize(tasks, 'offene Aufgabe', 'offene Aufgaben'))
  }

  const portfolioParts: string[] = []
  if (customers !== null) portfolioParts.push(pluralize(customers, 'registrierter Kunde', 'registrierte Kunden'))
  if (workshops !== null) portfolioParts.push(pluralize(workshops, 'Werkstatt', 'Werkstätten'))

  let briefingSentence = ''
  if (briefing.length > 0) {
    const last = briefing.pop()!
    briefingSentence = briefing.length
      ? `Aktueller Stand: ${briefing.join(', ')} sowie ${last}.`
      : `Aktueller Stand: ${last}.`
  }

  let portfolioSentence = ''
  if (portfolioParts.length > 0) {
    portfolioSentence = `Im Portfolio befinden sich ${portfolioParts.join(' und ')}.`
  }

  let commissionSentence = ''
  if (commissions !== null) {
    // Deutsche Sprechweise: "1234 Euro und 56 Cent" (ohne Tausenderpunkt, da TTS sonst stockt)
    const euros = Math.floor(commissions)
    const cents = Math.round((commissions - euros) * 100)
    const amountSpoken = cents === 0
      ? `${euros} Euro`
      : `${euros} Euro und ${cents} Cent`
    commissionSentence = commissions > 0
      ? `Die Provision für den laufenden Monat beläuft sich auf ${amountSpoken}.`
      : `Im laufenden Monat wurde noch keine Provision verbucht.`
  }

  const text = [
    `${greeting}, ${salutation}.`,
    `Es ist ${weekday}, der ${day}. ${month} ${year}, ${timeStr}.`,
    `Alle Bereifung24-Systeme sind betriebsbereit, sämtliche Schnittstellen reagieren im Normalbereich.`,
    briefingSentence,
    portfolioSentence,
    commissionSentence,
    `Ich stehe Ihnen vollumfänglich zur Verfügung.`,
  ].filter(Boolean).join(' ')

  return NextResponse.json({ greeting: text })
}

// Backwards-compatible GET (without stats)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const berlin = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
  const hour = berlin.getHours()
  const greeting = timeOfDayGreeting(hour)
  return NextResponse.json({
    greeting: `${greeting}, Sir. Jarvis ist online. Alle Systeme betriebsbereit. Ich stehe Ihnen zur Verfügung.`,
  })
}
