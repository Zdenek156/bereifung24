/**
 * KI-Analyse einer Werkstatt-Website (kombiniert mit Google-Places-Daten)
 * → strukturierte Insights, die als Input für die Email-Generierung dienen.
 */
import { generateText } from '@/lib/ai/geminiService'
import type { CrawlResult } from './websiteCrawler'

export interface ProspectInsights {
  summary: string                  // 2-3 Sätze "Wer ist die Werkstatt?"
  services: string[]               // angebotene Leistungen
  brands: string[]                 // erkennbare Marken / Spezialisierung
  targetGroups: string[]           // PKW / LKW / Motorrad / Flotten / E-Autos…
  uniqueSellingPoints: string[]    // USPs / Differenzierung
  weaknesses: string[]             // Verbesserungspotenzial (Webseite, Buchung, Reichweite…)
  fitForBereifung24: number        // 1-10 wie gut passt unser Modell
  fitReasoning: string             // kurze Begründung des Scores
  recommendedAngle: string         // bester Aufhänger für die erste Email
  language: 'de' | 'en'
}

interface AnalyzeInput {
  name: string
  city: string
  postalCode: string
  website?: string | null
  phone?: string | null
  email?: string | null
  rating?: number | null
  reviewCount?: number | null
  placeTypes?: string[]
  crawl?: CrawlResult | null
}

const FALLBACK: ProspectInsights = {
  summary: 'Keine ausreichenden Daten für eine vollständige Analyse vorhanden.',
  services: [],
  brands: [],
  targetGroups: [],
  uniqueSellingPoints: [],
  weaknesses: ['Webseite konnte nicht oder nur unvollständig analysiert werden'],
  fitForBereifung24: 5,
  fitReasoning: 'Bewertung neutral, da Datenlage dünn.',
  recommendedAngle:
    'Allgemeines Vorstellungs-Email mit Fokus auf Reichweite und kostenfreie Listing-Möglichkeit.',
  language: 'de',
}

function safeJsonExtract(text: string): any | null {
  if (!text) return null
  // Fence entfernen falls vorhanden
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  // Ersten { ... } Block isolieren
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const slice = cleaned.slice(start, end + 1)
  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

export async function analyzeProspect(input: AnalyzeInput): Promise<ProspectInsights> {
  const crawlBlock = input.crawl
    ? `Webseiten-Auszug (${input.crawl.pages.length} Seiten, ${input.crawl.combinedText.length} Zeichen):\n"""\n${input.crawl.combinedText.slice(0, 8000)}\n"""\nGefundene Emails: ${input.crawl.emails.join(', ') || '–'}\nGefundene Telefonnummern: ${input.crawl.phones.join(', ') || '–'}\nFehler: ${input.crawl.errors.join('; ') || 'keine'}`
    : 'Keine Webseiten-Daten verfügbar.'

  const prompt = `Du bist Sales-Analyst für Bereifung24 (B2B-Plattform die Reifenservices an Endkunden vermittelt und an Werkstätten weiterleitet).
Analysiere die folgende Werkstatt und gib NUR ein JSON zurück (kein Markdown, keine Erklärung):

Werkstatt-Stammdaten:
- Name: ${input.name}
- Ort: ${input.postalCode} ${input.city}
- Webseite: ${input.website || '–'}
- Telefon: ${input.phone || '–'}
- Email: ${input.email || '–'}
- Google Rating: ${input.rating ?? '–'} (${input.reviewCount ?? 0} Reviews)
- Google Place Types: ${(input.placeTypes || []).join(', ') || '–'}

${crawlBlock}

Liefere genau dieses JSON-Schema:
{
  "summary": string (2-3 Sätze, deutsch),
  "services": string[] (max 8, deutsch),
  "brands": string[] (max 8),
  "targetGroups": string[] (z.B. "PKW", "LKW", "Motorrad", "Flotten", "E-Autos"),
  "uniqueSellingPoints": string[] (max 5),
  "weaknesses": string[] (max 5, konkret und freundlich formuliert),
  "fitForBereifung24": number (1-10),
  "fitReasoning": string (1-2 Sätze, deutsch),
  "recommendedAngle": string (1-2 Sätze, deutsch, konkreter Aufhänger für eine Erstansprache),
  "language": "de"
}

WICHTIG: Antworte ausschließlich mit gültigem JSON. Erfinde keine Fakten, die nicht aus den Daten ableitbar sind.`

  let raw = ''
  try {
    raw = await generateText(prompt, { temperature: 0.4, maxOutputTokens: 1500 })
  } catch (err) {
    console.error('[aiAnalysis] Gemini error:', err)
    return { ...FALLBACK, weaknesses: ['Gemini-Aufruf fehlgeschlagen'] }
  }

  const parsed = safeJsonExtract(raw)
  if (!parsed || typeof parsed !== 'object') {
    return FALLBACK
  }

  const ensureArr = (v: any): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 10) : []

  return {
    summary: String(parsed.summary || FALLBACK.summary).slice(0, 600),
    services: ensureArr(parsed.services),
    brands: ensureArr(parsed.brands),
    targetGroups: ensureArr(parsed.targetGroups),
    uniqueSellingPoints: ensureArr(parsed.uniqueSellingPoints),
    weaknesses: ensureArr(parsed.weaknesses),
    fitForBereifung24:
      typeof parsed.fitForBereifung24 === 'number'
        ? Math.max(1, Math.min(10, Math.round(parsed.fitForBereifung24)))
        : 5,
    fitReasoning: String(parsed.fitReasoning || '').slice(0, 400),
    recommendedAngle: String(parsed.recommendedAngle || FALLBACK.recommendedAngle).slice(0, 600),
    language: 'de',
  }
}
