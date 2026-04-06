import { prisma } from '@/lib/prisma'
import { SocialMediaTrigger } from '@prisma/client'

/**
 * Content Generator Service - Uses Gemini for AI-powered social media text generation
 */

interface ContentGenerationParams {
  postType: string
  workshopName?: string
  city?: string
  services?: string[]
  rating?: number
  blogTitle?: string
  blogExcerpt?: string
  platform?: string
  customPrompt?: string
}

/**
 * Generate post text using Gemini AI
 */
export async function generatePostContent(params: ContentGenerationParams): Promise<{
  title: string
  content: string
  hashtags: string
}> {
  // Fetch Gemini API key from settings
  const apiKeySetting = await prisma.adminApiSetting.findFirst({
    where: { key: 'GEMINI_API_KEY' }
  })

  if (!apiKeySetting?.value) {
    throw new Error('Gemini API key not configured. Go to Admin → API-Einstellungen.')
  }

  const prompt = buildPrompt(params)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeySetting.value}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse structured response: TITEL:, TEXT:, HASHTAGS:
  const titleMatch = text.match(/TITEL:\s*(.+?)(?:\n|TEXT:)/si)
  const textMatch = text.match(/TEXT:\s*([\s\S]+?)(?:HASHTAGS:|$)/si)
  const hashtagMatch = text.match(/HASHTAGS:\s*([\s\S]+)/si)

  const title = titleMatch?.[1]?.trim() || ''
  let content = textMatch?.[1]?.trim() || text.replace(/TITEL:.*\n?/i, '').replace(/HASHTAGS:[\s\S]*/i, '').trim()
  const hashtagLine = hashtagMatch?.[1]?.trim() || ''

  // Extract hashtags - match all #words
  const hashtagsArray = hashtagLine.match(/#[\wäöüÄÖÜß]+/g) || content.match(/#[\wäöüÄÖÜß]+/g) || []
  const hashtags = hashtagsArray.length > 0 ? hashtagsArray.join(' ') : '#Bereifung24 #Reifen #Werkstatt #Reifenwechsel #KFZ'

  // Remove any remaining hashtags from content
  content = content.replace(/#[\wäöüÄÖÜß]+/g, '').replace(/\n{3,}/g, '\n\n').trim()

  return { title, content, hashtags }
}

function buildPrompt(params: ContentGenerationParams): string {
  const baseInstructions = `Du bist der Social-Media-Manager von Bereifung24.de – einer Online-Plattform, die Autofahrer mit professionellen Reifenwerkstätten in ganz Deutschland verbindet. Kunden können über bereifung24.de Reifen montieren lassen, Termine buchen und Werkstätten vergleichen.

WICHTIG – Antworte EXAKT in diesem Format:

TITEL: [Kurzer, knackiger Titel, max 8 Wörter, mit 1-2 Emojis]

TEXT: [Der vollständige Post-Text. Mindestens 150 Wörter. Verwende Absätze, Emojis und einen professionellen aber freundlichen Ton. Schließe mit einem Call-to-Action ab, z.B. "Jetzt auf bereifung24.de deinen Termin buchen!" oder "Besuche uns auf bereifung24.de!"]

HASHTAGS: [Mindestens 15 themenrelevante Hashtags, jeweils mit # beginnend, durch Leerzeichen getrennt. Immer dabei: #Bereifung24 #Reifen #Werkstatt. Dann themenspezifische Hashtags.]

Plattform: ${params.platform || 'Facebook/Instagram'}
Schreibe alles auf Deutsch.`

  switch (params.postType) {
    case 'PARTNER_INTRO':
      return `${baseInstructions}

AUFGABE: Schreibe einen herzlichen Willkommens-Post für eine neue Partnerwerkstatt auf Bereifung24.

Details:
- Werkstattname: ${params.workshopName || 'Neue Partnerwerkstatt'}
- Stadt/Region: ${params.city || 'Deutschland'}
- Angebotene Services: ${params.services?.join(', ') || 'Reifenwechsel, Reifeneinlagerung, Auswuchten'}

Der Post soll:
1. Die neue Werkstatt herzlich willkommen heißen
2. Die Partnerschaft mit Bereifung24 hervorheben
3. Die Services der Werkstatt vorstellen
4. Kunden aus der Region einladen, die Werkstatt zu besuchen
5. Mit einem Call-to-Action enden (Termin buchen auf bereifung24.de)

Schreibe mindestens 200 Wörter. Verwende Emojis wie 🎉🔧🏪🤝🛞 passend im Text.`

    case 'TIRE_TIP':
      return `${baseInstructions}

AUFGABE: Schreibe einen informativen und nützlichen Saisontipp rund um das Thema Reifen.

Berücksichtige den aktuellen Monat und die Jahreszeit. Mögliche Themen:
- Wann von Sommer- auf Winterreifen wechseln (und umgekehrt)
- Mindestprofiltiefe und wie man sie prüft (1,6mm gesetzlich, 3mm empfohlen)
- Reifendruck regelmäßig prüfen – Sicherheit und Spritverbrauch
- Reifenalter: DOT-Nummer lesen und ab wann Reifen zu alt sind
- Reifenlagerung: richtig einlagern bei Bereifung24-Partnern
- Aquaplaning vermeiden durch gute Reifen
- Ganzjahresreifen vs. Saisonreifen – Vorteile und Nachteile

Schreibe mindestens 200 Wörter. Sei informativ, gib konkrete Tipps und erkläre, warum das wichtig ist. Verwende passende Emojis wie 🛞💡✅⚠️❄️☀️🌧️.`

    case 'BLOG_PROMO':
      return `${baseInstructions}

AUFGABE: Bewerbe einen neuen Blog-Artikel von Bereifung24.

Blog-Details:
- Titel: ${params.blogTitle || 'Neuer Blog-Artikel'}
- Zusammenfassung: ${params.blogExcerpt || 'Ein informativer Artikel rund um Reifen und Fahrzeugsicherheit.'}

Der Post soll:
1. Neugier wecken – warum sollte man den Artikel lesen?
2. Die wichtigsten Punkte anteasern ohne alles zu verraten
3. Den Mehrwert für den Leser betonen
4. Mit einem klaren Call-to-Action zum Blog-Link enden

Schreibe mindestens 150 Wörter. Verwende Emojis wie 📖✨🔗👀💡.`

    case 'REVIEW_HIGHLIGHT':
      return `${baseInstructions}

AUFGABE: Stelle eine hervorragend bewertete Partnerwerkstatt vor und feiere ihre Leistung.

Details:
- Werkstattname: ${params.workshopName || 'Top-bewertete Werkstatt'}
- Stadt/Region: ${params.city || 'Deutschland'}
- Bewertung: ${params.rating || 5}/5 Sterne

Der Post soll:
1. Die Werkstatt und ihre tolle Bewertung hervorheben
2. Erklären, was diese Werkstatt besonders macht (z.B. Service, Freundlichkeit, Pünktlichkeit)
3. Kunden motivieren, auch eine Bewertung abzugeben
4. Andere Kunden einladen, die Werkstatt auf bereifung24.de zu finden

Schreibe mindestens 180 Wörter. Verwende Emojis wie ⭐🏆🎊👏🛞.`

    case 'STATS':
      return `${baseInstructions}

AUFGABE: Erstelle einen beeindruckenden Meilenstein- oder Statistik-Post über das Wachstum von Bereifung24.

Mögliche Themen (wähle ein passendes):
- Wachsende Anzahl an Partnerwerkstätten in ganz Deutschland
- Zufriedene Kunden und positive Bewertungen
- Regionale Abdeckung und neue Städte
- Gebuchte Termine und Servicequalität
- Community-Wachstum auf Social Media

Der Post soll:
1. Einen beeindruckenden Statistik-Fakt in den Mittelpunkt stellen
2. Dankbarkeit an Kunden und Partner ausdrücken
3. Die Vision von Bereifung24 für die Zukunft teilen
4. Mit einem motivierenden Call-to-Action enden

Schreibe mindestens 180 Wörter. Verwende Emojis wie 📊🚀🎯💪✨📈.`

    case 'OFFER':
      return `${baseInstructions}

AUFGABE: Erstelle einen aufmerksamkeitsstarken Aktions-Post für ein Sonderangebot oder eine Rabattaktion auf Bereifung24.

Der Post soll:
1. Sofort Aufmerksamkeit erregen (z.B. "🔥 MEGA-DEAL!" oder "⚡ Nur für kurze Zeit!")
2. Das Angebot klar und verständlich beschreiben
3. Dringlichkeit erzeugen (zeitlich begrenzt, limitierte Plätze, etc.)
4. Einen starken Call-to-Action haben (Jetzt buchen, Code einlösen, etc.)
5. Den Nutzen für den Kunden hervorheben (Geld sparen, Premium-Service, etc.)

Schreibe mindestens 180 Wörter. Verwende Emojis wie 🔥💰🎁⚡✅🏷️.`

    case 'SERVICE':
      return `${baseInstructions}

AUFGABE: Stelle einen der Services vor, die über Bereifung24 gebucht werden können.

Mögliche Services:
- Reifenwechsel (Sommer/Winter)
- Reifeneinlagerung (Hotel für deine Reifen)
- Auswuchten
- RDKS-Service (Reifendruckkontrollsystem)
- Felgenreparatur
- Achsvermessung

Beschreibe den Service ausführlich:
1. Was genau wird gemacht?
2. Warum ist dieser Service wichtig für Sicherheit/Komfort?
3. Wie einfach ist die Buchung über bereifung24.de?
4. Vorteile der Buchung über Bereifung24 (Preisvergleich, Bewertungen, etc.)

Schreibe mindestens 200 Wörter. Verwende Emojis wie 🔧🛞✅💼🚗.`

    case 'REEL':
      return `${baseInstructions}

AUFGABE: Schreibe einen kurzen, knackigen Text für ein Instagram Reel oder TikTok Video über Bereifung24.

Der Text soll:
1. Kurz und prägnant sein (max 100 Wörter für den Text-Overlay)
2. Einen Hook am Anfang haben ("Wusstest du...?", "Das passiert wenn...", "3 Gründe warum...")
3. Visuell beschreiben, was im Video zu sehen sein soll (in Klammern als Regie-Anweisung)
4. Einen knackigen Abschluss mit CTA

Trotzdem TITEL und HASHTAGS im geforderten Format liefern (mindestens 15 Hashtags, auch TikTok-relevante).`

    case 'CUSTOM':
    default:
      return `${baseInstructions}

AUFGABE: ${params.customPrompt || 'Erstelle einen ansprechenden, allgemeinen Social-Media-Post über Bereifung24.de – die Plattform, die Autofahrer mit den besten Reifenwerkstätten verbindet. Beschreibe die Vorteile: einfache Online-Buchung, Werkstattvergleich, Kundenbewertungen, transparente Preise. Schreibe mindestens 180 Wörter.'}`
  }
}

/**
 * Fill a template with variables
 */
export function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

/**
 * Handle automation trigger — creates a post when an event fires
 */
export async function handleAutomationTrigger(
  trigger: SocialMediaTrigger,
  variables: Record<string, string>
) {
  // Find active automations for this trigger
  const automations = await prisma.socialMediaAutomation.findMany({
    where: { trigger, isActive: true },
    include: { template: true }
  })

  const results = []

  for (const automation of automations) {
    try {
      // Fill template with variables
      const content = fillTemplate(automation.template.textTemplate, variables)

      // Get active accounts for the automation platforms
      const platforms = (automation.platforms as string[]) || []
      const accounts = await prisma.socialMediaAccount.findMany({
        where: {
          platform: { in: platforms as any },
          isActive: true
        }
      })

      if (accounts.length === 0) continue

      // Create post
      const post = await prisma.socialMediaPost.create({
        data: {
          title: `Auto: ${automation.name}`,
          content,
          postType: automation.template.postType,
          status: automation.autoPublish ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: automation.autoPublish ? new Date() : null,
          templateId: automation.template.id,
          automationId: automation.id,
          platforms: {
            create: accounts.map((account: { id: string }) => ({
              accountId: account.id,
              status: automation.autoPublish ? 'SCHEDULED' : 'DRAFT' as any
            }))
          }
        }
      })

      // Update last triggered
      await prisma.socialMediaAutomation.update({
        where: { id: automation.id },
        data: { lastTriggeredAt: new Date() }
      })

      results.push({ automationId: automation.id, postId: post.id, status: 'created' })
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error)
      results.push({ automationId: automation.id, status: 'error', error: String(error) })
    }
  }

  return results
}
