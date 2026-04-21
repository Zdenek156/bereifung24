import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { generateText } from '@/lib/ai/geminiService'

/**
 * POST /api/admin/workshop-recommendations/generate
 *
 * Body: {
 *   workshopId: string,
 *   adminNotes: string,        // Stichpunkte vom Mitarbeiter
 *   topics?: string[],         // Quick-Tags
 *   tone?: 'FRIENDLY'|'PROFESSIONAL'|'MOTIVATING',
 *   language?: 'de'|'en'
 * }
 *
 * Generiert Betreff + Text via Gemini. Kein DB-Write (erst beim Senden).
 */

const TOPIC_LABELS: Record<string, string> = {
  profile_picture: 'Profilbild fehlt oder unvollständig',
  opening_hours: 'Öffnungszeiten unvollständig',
  slow_response: 'Reaktionszeit auf Anfragen zu langsam',
  few_tires: 'Zu wenige Reifen im Katalog / Inventar',
  low_ratings: 'Wenige oder niedrige Bewertungen',
  no_direct_booking: 'Direktbuchung nicht aktiviert',
  high_prices: 'Preise liegen über Markt-Durchschnitt',
  no_stripe: 'Zahlungsabwicklung (Stripe) nicht eingerichtet',
  no_landing_page: 'Landingpage fehlt oder inaktiv',
  missing_services: 'Zu wenige Services hinterlegt',
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  FRIENDLY: 'Schreibe in einem freundlichen, kollegialen Ton – du-Form, warm, unterstützend.',
  PROFESSIONAL: 'Schreibe in einem sachlichen, professionellen Ton – Sie-Form, klar und strukturiert.',
  MOTIVATING: 'Schreibe in einem motivierenden, positiven Ton – du-Form, energiegeladen, mit konkreten Vorteilen.',
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const { workshopId, adminNotes, topics, tone = 'FRIENDLY', language = 'de' } = body

    if (!workshopId || !adminNotes?.trim()) {
      return NextResponse.json({ error: 'workshopId und adminNotes sind Pflicht' }, { status: 400 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, city: true } },
        _count: { select: { offers: true, reviews: true, bookings: true } },
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const contactName = `${workshop.user.firstName} ${workshop.user.lastName}`.trim() || 'Team'
    const topicsText = (topics || [])
      .map((t: string) => TOPIC_LABELS[t] || t)
      .filter(Boolean)
      .map((t: string) => `- ${t}`)
      .join('\n')

    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.FRIENDLY

    const prompt = `Du bist Account-Manager bei Bereifung24, einer deutschen Plattform für Reifenwechsel-Vermittlung zwischen Kunden und Werkstätten. Verfasse eine persönliche Email an eine registrierte Partner-Werkstatt mit konkreten Optimierungs-Empfehlungen, damit sie mehr Kundenanfragen erhält und ihre Conversion steigert.

**Werkstatt-Kontext:**
- Firmenname: ${workshop.companyName}
- Kontaktperson: ${contactName}
- Stadt: ${workshop.user.city || '-'}
- Bisher ${workshop._count.offers} abgegebene Angebote, ${workshop._count.bookings} Buchungen, ${workshop._count.reviews} Bewertungen
- Status: ${workshop.isVerified ? 'Verifiziert' : 'Nicht verifiziert'}

**Interne Notizen des Mitarbeiters (Basis der Empfehlung – NICHT 1:1 zitieren, sondern in professionellen Text übersetzen):**
${adminNotes}

${topicsText ? `**Identifizierte Handlungsfelder:**\n${topicsText}` : ''}

**Tonalität:**
${toneInstruction}

**Sprache:** ${language === 'en' ? 'English' : 'Deutsch'}

**Aufbau der Email:**
1. Kurze persönliche Ansprache (max. 1 Satz)
2. Wertschätzender Einstieg (Partnerschaft/Potenzial erkennen)
3. 2-4 konkrete, umsetzbare Empfehlungen – jeweils mit kurzer Begründung WARUM das hilft
4. Positiver Ausblick + Angebot zur Unterstützung
5. Kein Gruß/keine Signatur (wird automatisch angefügt)

**Strikte Regeln:**
- Nicht belehrend, nicht bevormundend
- Keine leeren Marketing-Floskeln
- Konkret, umsetzbar, realistisch
- Max. 200-260 Wörter im Body
- KEINE Markdown-Formatierung (kein **fett**, keine Überschriften, keine Bullet-Listen mit Sternchen)
- Absätze mit doppeltem Zeilenumbruch trennen
- Keine Signatur und keinen "Mit freundlichen Grüßen"-Block schreiben

**Ausgabeformat (EXAKT einhalten, nichts anderes zurückgeben):**
BETREFF: <prägnanter Betreff, max. 70 Zeichen>
---
<Email-Body als fließender Text mit Absätzen>`

    const raw = await generateText(prompt, { temperature: 0.75, maxOutputTokens: 1500 })

    // Parse "BETREFF: ...\n---\n<body>"
    const subjectMatch = raw.match(/BETREFF:\s*(.+?)(?:\n|$)/i)
    const separatorIndex = raw.indexOf('---')
    const subject = (subjectMatch?.[1] || `Empfehlung für ${workshop.companyName}`).trim()
    const bodyText = separatorIndex >= 0
      ? raw.substring(separatorIndex + 3).trim()
      : raw.replace(/^BETREFF:.*\n?/i, '').trim()

    return NextResponse.json({
      subject,
      body: bodyText,
      workshop: {
        id: workshop.id,
        companyName: workshop.companyName,
        contactName,
        email: workshop.user.email,
      },
    })
  } catch (error: any) {
    console.error('[workshop-recommendations/generate]', error)
    return NextResponse.json(
      { error: error?.message || 'Generierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
