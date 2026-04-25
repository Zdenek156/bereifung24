import { prisma } from '@/lib/prisma'

/**
 * Trends Service
 * - Saisonal-Engine (datum-basiert)
 * - Optional: Externe News-RSS Feeds (für KI-Inspiration)
 * - KI-Brainstorming via Gemini, basierend auf Keywords + History
 *
 * Output-Format pro Post: title, content, hashtags
 */

// --------------------------------------------------------------------------
// TYPES
// --------------------------------------------------------------------------

export type Audience = 'CUSTOMER' | 'WORKSHOP' | 'BOTH'
export type Style = 'INFORMATIVE' | 'FUNNY' | 'PROVOCATIVE' | 'STORY' | 'EMOTIONAL'

export interface TrendInspiration {
  category: 'SAISONAL' | 'NEWS' | 'KI'
  title: string
  hint?: string
  source?: string
}

export interface TrendPostInput {
  keywords: string[]
  audience: Audience
  style: Style
  count: number
  platform?: string
}

export interface GeneratedTrendPost {
  title: string
  content: string
  hashtags: string
}

// --------------------------------------------------------------------------
// SAISONAL-ENGINE (regelbasiert, kostenlos, deterministisch)
// --------------------------------------------------------------------------

function getSeasonalInspirations(date = new Date()): TrendInspiration[] {
  const month = date.getMonth() + 1 // 1-12
  const list: TrendInspiration[] = []

  // Sommerreifen-Saison (März-April)
  if (month >= 3 && month <= 4) {
    list.push(
      { category: 'SAISONAL', title: 'Von O bis O – Jetzt Sommerreifen wechseln', hint: 'Ostern bis Oktober Faustregel' },
      { category: 'SAISONAL', title: 'Pollen, Streusalz & Lackschäden im Frühjahr', hint: 'Frühjahrs-Check Themen' },
      { category: 'SAISONAL', title: 'Warum 7°C die magische Grenze für Sommerreifen ist', hint: 'Materialkunde' }
    )
  }

  // Sommerhitze (Mai-August)
  if (month >= 5 && month <= 8) {
    list.push(
      { category: 'SAISONAL', title: 'Reifendruck im Sommer – Hitze killt deine Reifen', hint: 'Sicherheits-Tipp' },
      { category: 'SAISONAL', title: 'Urlaubsfahrt mit Anhänger – richtig bereift?', hint: 'Reise-Saison' },
      { category: 'SAISONAL', title: 'Aquaplaning bei Sommergewittern vermeiden', hint: 'Profiltiefen-Check' }
    )
  }

  // Winterreifen-Saison (September-November)
  if (month >= 9 && month <= 11) {
    list.push(
      { category: 'SAISONAL', title: 'Winterreifen-Pflicht: Was 2026 gilt', hint: 'Situative Winterreifenpflicht §2 StVO' },
      { category: 'SAISONAL', title: 'Engpass alarm – Winterreifen jetzt sichern', hint: 'Liefertermine knapp' },
      { category: 'SAISONAL', title: 'Alpine-Symbol vs. M+S: Welche Reifen sind 2026 noch erlaubt?', hint: 'Übergangsregelung' }
    )
  }

  // Winter (Dezember-Februar)
  if (month === 12 || month <= 2) {
    list.push(
      { category: 'SAISONAL', title: 'Reifen einlagern lassen – Hotelservice deiner Werkstatt', hint: 'Tire-Hotel' },
      { category: 'SAISONAL', title: 'Glatteis & Schnee – So fährst du sicher', hint: 'Fahrtechnik' },
      { category: 'SAISONAL', title: 'Reifenalter prüfen: DOT-Nummer richtig lesen', hint: 'Alters-Check während Stillstand' }
    )
  }

  // Ganzjährig
  list.push(
    { category: 'SAISONAL', title: 'TÜV durchgefallen wegen Reifen? Häufigster Grund 2025', hint: 'Profiltiefe & Beschädigungen' },
    { category: 'SAISONAL', title: 'EU-Reifenlabel verstehen: A-G richtig deuten', hint: 'Spritsparen, Nasshaftung, Lärm' }
  )

  return list
}

// --------------------------------------------------------------------------
// RSS NEWS FETCH (für KI-Kontext, kostenlos)
// --------------------------------------------------------------------------

interface NewsItem {
  title: string
  source: string
}

async function fetchNewsHeadlines(): Promise<NewsItem[]> {
  // Google News RSS Suchen (kein API-Key nötig)
  const queries = [
    { q: 'Reifen+Auto', source: 'Google News' },
    { q: 'TÜV+Hauptuntersuchung', source: 'Google News' },
    { q: 'Winterreifen+Sommerreifen', source: 'Google News' },
  ]

  const items: NewsItem[] = []

  for (const { q, source } of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${q}&hl=de&gl=DE&ceid=DE:de`
      const res = await fetch(url, {
        next: { revalidate: 3600 }, // 1h cache
        signal: AbortSignal.timeout(5000)
      })
      if (!res.ok) continue
      const xml = await res.text()
      // Einfacher Parser für <title>…</title> in <item>
      const itemRegex = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([^<\]]+)/g
      let match
      let count = 0
      while ((match = itemRegex.exec(xml)) !== null && count < 5) {
        const title = match[1].trim()
        if (title && title.length > 10 && !title.toLowerCase().includes('google')) {
          items.push({ title, source })
          count++
        }
      }
    } catch (err) {
      console.warn(`[trendsService] RSS fetch failed for ${q}:`, err instanceof Error ? err.message : err)
    }
  }

  return items
}

// --------------------------------------------------------------------------
// KI-INSPIRATIONEN (Gemini verdichtet RSS + Saison zu Post-Ideen)
// --------------------------------------------------------------------------

async function getGeminiKey(): Promise<string | null> {
  const setting = await prisma.adminApiSetting.findFirst({ where: { key: 'GEMINI_API_KEY' } })
  return setting?.value || null
}

async function callGemini(prompt: string, maxTokens = 2048): Promise<string> {
  const key = await getGeminiKey()
  if (!key) throw new Error('Gemini API key nicht konfiguriert (Admin → API-Einstellungen)')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.95, // höher für mehr Abwechslung
          topP: 0.95,
          maxOutputTokens: maxTokens
        }
      })
    }
  )

  if (!res.ok) {
    throw new Error(`Gemini API Fehler: ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function getKiInspirations(news: NewsItem[], recentTitles: string[]): Promise<TrendInspiration[]> {
  const key = await getGeminiKey()
  if (!key) return [] // Wenn kein Key, nur Saisonal+News

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const prompt = `Du bist Social-Media-Stratege für Bereifung24.de (Plattform für Reifenwerkstätten in Deutschland).

Heute ist: ${today}

AKTUELLE NEWS-SCHLAGZEILEN (aus RSS-Feeds):
${news.slice(0, 12).map((n, i) => `${i + 1}. ${n.title}`).join('\n')}

BEREITS GEPOSTET (NICHT WIEDERHOLEN):
${recentTitles.slice(0, 20).map(t => `- ${t}`).join('\n') || '(keine)'}

AUFGABE: Erstelle 5 frische, kreative Post-Ideen für Bereifung24 zur Inspiration. Jede Idee:
- soll für Endkunden ODER Werkstätten interessant sein
- soll thematisch zu Reifen, Werkstatt, KFZ-Sicherheit, Mobilität passen
- soll sich von den bereits geposteten Themen unterscheiden
- darf an aktuelle Schlagzeilen anknüpfen, muss aber nicht

ANTWORTE EXAKT IN DIESEM FORMAT (KEIN MARKDOWN, KEIN PREAMBLE):
1| TITEL | kurze Hint
2| TITEL | kurze Hint
3| TITEL | kurze Hint
4| TITEL | kurze Hint
5| TITEL | kurze Hint`

  try {
    const text = await callGemini(prompt, 1024)
    const lines = text.split('\n').filter(l => /^\d\|/.test(l.trim()))
    return lines.map(line => {
      const parts = line.split('|').map(p => p.trim())
      return {
        category: 'KI' as const,
        title: parts[1] || '',
        hint: parts[2] || ''
      }
    }).filter(i => i.title.length > 5)
  } catch (err) {
    console.error('[trendsService] KI inspirations failed:', err)
    return []
  }
}

// --------------------------------------------------------------------------
// PUBLIC: ALL INSPIRATIONS
// --------------------------------------------------------------------------

export async function getAllInspirations(): Promise<{
  saisonal: TrendInspiration[]
  news: TrendInspiration[]
  ki: TrendInspiration[]
}> {
  const seasonal = getSeasonalInspirations()

  // Letzte Post-Titel als Anti-Wiederholungs-Liste
  const recentPosts = await prisma.socialMediaPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { title: true, content: true }
  })
  const recentTitles = recentPosts.map(p => p.title || p.content.slice(0, 80)).filter(Boolean)

  const newsRaw = await fetchNewsHeadlines()
  const news: TrendInspiration[] = newsRaw.slice(0, 8).map(n => ({
    category: 'NEWS' as const,
    title: n.title,
    source: n.source
  }))

  const ki = await getKiInspirations(newsRaw, recentTitles)

  return { saisonal: seasonal, news, ki }
}

// --------------------------------------------------------------------------
// PUBLIC: GENERATE POSTS FROM KEYWORDS
// --------------------------------------------------------------------------

const AUDIENCE_DESC: Record<Audience, string> = {
  CUSTOMER: 'Endkunden / Autofahrer (Du-Form, persönlich, Sicherheits- und Komfort-Fokus, CTA: "Termin buchen auf bereifung24.de")',
  WORKSHOP: 'Reifenwerkstätten / Inhaber (Sie-Form, professionell, Umsatz- und Auslastungs-Fokus, CTA: "Werde Partner auf bereifung24.de")',
  BOTH: 'Beide Zielgruppen (neutraler Mehrwert, sowohl Endkunden als auch Werkstätten ansprechen, beide CTAs)'
}

const STYLE_DESC: Record<Style, string> = {
  INFORMATIVE: 'sachlich, fachlich fundiert, mit konkreten Tipps und Zahlen',
  FUNNY: 'humorvoll, locker, mit einem Augenzwinkern – aber nicht albern',
  PROVOCATIVE: 'aufrüttelnd, ein bisschen kontrovers, regt zum Nachdenken an',
  STORY: 'als kleine Geschichte/Anekdote erzählt, mit Anfang-Mitte-Ende',
  EMOTIONAL: 'emotional, menschlich, berührend – betont Sicherheit der Familie/Liebsten'
}

export async function generateTrendPosts(input: TrendPostInput): Promise<GeneratedTrendPost[]> {
  const { keywords, audience, style, count, platform } = input

  if (!keywords.length) throw new Error('Mindestens ein Keyword erforderlich')

  // Anti-Wiederholungs-History
  const recentPosts = await prisma.socialMediaPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { title: true, content: true }
  })
  const recentTitles = recentPosts
    .map(p => p.title || p.content.slice(0, 80))
    .filter(Boolean)
    .slice(0, 20)

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const prompt = `Du bist der Social-Media-Manager von Bereifung24.de – einer Online-Plattform, die Autofahrer mit Reifenwerkstätten in Deutschland verbindet. Heute ist: ${today}

ZIELGRUPPE: ${AUDIENCE_DESC[audience]}
STIL: ${STYLE_DESC[style]}
PLATTFORM: ${platform || 'Facebook/Instagram/LinkedIn'}

KEYWORDS / TRENDS (vom Marketing-Team aus Google Trends ausgewählt):
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

BEREITS GEPOSTET (vermeide diese Themen und Formulierungen):
${recentTitles.map(t => `- ${t}`).join('\n') || '(keine)'}

AUFGABE: Erstelle ${count} unterschiedliche, kreative Social-Media-Posts. Jeder Post soll EIN Keyword aus der Liste aufgreifen (oder mehrere kombinieren). Variiere die Posts deutlich – verschiedene Hooks, Längen, Strukturen.

ANTWORTE EXAKT IN DIESEM FORMAT (für jeden Post genau dieser Block, getrennt durch ===):

===POST===
TITEL: [Kurzer, knackiger Titel, max 8 Wörter, mit 1-2 Emojis]
TEXT: [Vollständiger Post-Text, mindestens 150 Wörter, mit Absätzen, Emojis, professioneller aber freundlicher Ton, klares Call-to-Action am Ende]
HASHTAGS: [Mindestens 12 themenrelevante Hashtags, mit # beginnend, durch Leerzeichen getrennt. Immer dabei: #Bereifung24 #Reifen]
===POST===
[nächster Post]

Schreibe alles auf Deutsch. Erstelle GENAU ${count} Posts. Sei wirklich abwechslungsreich – verschiedene Tonality-Variationen innerhalb des gewählten Stils.`

  const text = await callGemini(prompt, 4096)

  // Parse multiple posts
  const blocks = text.split(/===POST===/i).map(b => b.trim()).filter(b => b.includes('TITEL:'))

  const posts: GeneratedTrendPost[] = blocks.map(block => {
    const titleMatch = block.match(/TITEL:\s*(.+?)(?:\n|TEXT:)/si)
    const textMatch = block.match(/TEXT:\s*([\s\S]+?)(?:HASHTAGS:|$)/si)
    const hashMatch = block.match(/HASHTAGS:\s*([\s\S]+?)$/si)

    const title = titleMatch?.[1]?.trim() || ''
    let content = textMatch?.[1]?.trim() || ''
    const hashLine = hashMatch?.[1]?.trim() || ''

    const hashtagsArray = hashLine.match(/#[\wäöüÄÖÜß]+/g) || []
    const hashtags = hashtagsArray.length > 0
      ? hashtagsArray.join(' ')
      : '#Bereifung24 #Reifen #Werkstatt #Reifenwechsel #KFZ'

    // Hashtags aus content entfernen
    content = content.replace(/#[\wäöüÄÖÜß]+/g, '').replace(/\n{3,}/g, '\n\n').trim()

    return { title, content, hashtags }
  }).filter(p => p.content.length > 20)

  if (posts.length === 0) {
    throw new Error('KI lieferte keine verwertbare Antwort. Bitte erneut versuchen.')
  }

  return posts
}
