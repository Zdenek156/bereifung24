/**
 * KI-Email-Generator für Sales-Outreach.
 * Erstellt personalisierte Cold-Outreach-Emails (FIRST_CONTACT, FOLLOWUP, BREAKUP)
 * basierend auf den Insights aus aiAnalysis.ts und einer optionalen
 * vorherigen Email-Historie.
 */
import { generateText } from '@/lib/ai/geminiService'
import type { ProspectInsights } from './aiAnalysis'

export type OutreachTemplate = 'FIRST_CONTACT' | 'FOLLOWUP' | 'BREAKUP' | 'CUSTOM'

export interface PreviousEmail {
  direction: 'OUTBOUND' | 'INBOUND'
  subject: string
  body: string
  sentAt?: Date | string | null
}

export interface GenerateInput {
  templateType: OutreachTemplate
  prospect: {
    name: string
    city: string
    contactPerson?: string | null
  }
  insights: ProspectInsights | null
  previousEmails?: PreviousEmail[]
  customNotes?: string
  senderName?: string
}

export interface GeneratedEmail {
  subject: string
  body: string  // Plaintext mit \n
}

const SIGNATURE = (senderName?: string) => `

Beste Grüße
${senderName || 'Dein Bereifung24-Team'}
Bereifung24 GmbH
partner@bereifung24.de
https://bereifung24.de`

function buildPrompt(input: GenerateInput): string {
  const ins = input.insights
  const insBlock = ins
    ? `KI-Insights über die Werkstatt:
- Zusammenfassung: ${ins.summary}
- Services: ${ins.services.join(', ') || '–'}
- Marken/Spezialisierung: ${ins.brands.join(', ') || '–'}
- Zielgruppen: ${ins.targetGroups.join(', ') || '–'}
- USPs: ${ins.uniqueSellingPoints.join(', ') || '–'}
- Verbesserungspotenzial: ${ins.weaknesses.join(', ') || '–'}
- Fit für Bereifung24 (1-10): ${ins.fitForBereifung24} – ${ins.fitReasoning}
- Empfohlener Aufhänger: ${ins.recommendedAngle}`
    : 'Keine KI-Insights verfügbar – bleib generisch und freundlich.'

  const history = (input.previousEmails || [])
    .slice(-4)
    .map(
      (e, i) =>
        `(${i + 1}) ${e.direction === 'OUTBOUND' ? 'WIR' : 'WERKSTATT'} – Betreff: "${e.subject}"\n${(e.body || '').slice(0, 600)}`
    )
    .join('\n\n')

  let intent = ''
  switch (input.templateType) {
    case 'FIRST_CONTACT':
      intent = `Schreibe eine ERSTE Cold-Outreach-Email an die Werkstatt.
- Persönlich (Stadt + ein konkreter Bezug aus den Insights)
- Stelle Bereifung24 in 1-2 Sätzen vor: "Wir bringen reine Reifen-Aufträge aus eurer Region zu lokalen Werkstätten – ohne monatliche Fixkosten, nur Provision pro vermitteltem Termin."
- Klarer, niedrigschwelliger CTA: 15-Minuten-Telefonat oder kostenlose Probe-Listung
- Maximal 130 Wörter`
      break
    case 'FOLLOWUP':
      intent = `Schreibe eine FOLLOW-UP-Email (höfliches Nachhaken nach ~5-7 Tagen ohne Antwort).
- Bezug auf die vorherige Email
- Ein neuer Mehrwert-Punkt (z.B. konkrete Anzahl Anfragen aus PLZ-Bereich, kostenlose Aufnahme)
- Sehr kurz (max 80 Wörter)
- Soft CTA`
      break
    case 'BREAKUP':
      intent = `Schreibe eine BREAKUP-Email (letzter freundlicher Versuch).
- Ehrlich und unaufdringlich
- Tür offen lassen ("falls in 3-6 Monaten relevant…")
- Max 70 Wörter
- Kein hartes Pitching mehr`
      break
    default:
      intent = input.customNotes || 'Schreibe eine kurze, professionelle Email.'
  }

  return `Du bist Sales-Texter für Bereifung24 (B2B-Plattform für Reifenservice-Vermittlung).
Schreibe auf DEUTSCH. Sprich die Werkstatt mit "Sie" an, freundlich, knapp, ohne Floskeln.
KEINE Emojis, KEINE übertriebenen Versprechen, KEIN Markdown.

Ziel: ${intent}

Werkstatt:
- Name: ${input.prospect.name}
- Ort: ${input.prospect.city}
- Ansprechpartner: ${input.prospect.contactPerson || 'unbekannt – nutze "Sehr geehrte Damen und Herren,"'}

${insBlock}

${history ? `Bisheriger Email-Verlauf:\n${history}\n` : 'Noch kein Verlauf.'}

${input.customNotes ? `Zusatz-Notizen vom Sales-Mitarbeiter:\n${input.customNotes}` : ''}

Antworte NUR mit gültigem JSON in genau diesem Schema:
{
  "subject": "string (max 70 Zeichen, ohne Re:/Fwd:, ohne Anführungszeichen drumherum)",
  "body": "string (Plaintext, mit \\n als Zeilenumbruch, OHNE Signatur am Ende)"
}`
}

function safeJsonExtract(text: string): any | null {
  if (!text) return null
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function generateOutreachEmail(input: GenerateInput): Promise<GeneratedEmail> {
  const prompt = buildPrompt(input)
  let raw = ''
  try {
    raw = await generateText(prompt, { temperature: 0.75, maxOutputTokens: 800 })
  } catch (err) {
    console.error('[aiEmailGenerator] Gemini error:', err)
    throw new Error('Gemini-Aufruf fehlgeschlagen')
  }

  const parsed = safeJsonExtract(raw)
  let subject = ''
  let body = ''

  if (parsed && typeof parsed === 'object') {
    subject = String(parsed.subject || '').trim()
    body = String(parsed.body || '').trim()
  }

  if (!subject || !body) {
    // Fallback: Subject aus erster Zeile ziehen
    const lines = raw.split('\n').filter((l) => l.trim().length > 0)
    subject = subject || (lines[0] || 'Bereifung24 – kurze Frage').slice(0, 70)
    body = body || lines.slice(1).join('\n').trim() || raw.trim()
  }

  // Signatur immer anhängen (vereinheitlicht)
  if (!body.includes('Bereifung24')) {
    body = body.replace(/\s+$/g, '') + SIGNATURE(input.senderName)
  }

  return {
    subject: subject.slice(0, 200),
    body: body.slice(0, 5000),
  }
}

/**
 * Wandelt Plaintext-Body in versandfähiges HTML um (mit Tracking-Pixel + Link-Tracking).
 * Tracking-URLs werden vom Aufrufer (API-Route) ergänzt.
 */
export function bodyToHtml(body: string, opts: { trackingPixelUrl?: string; clickRedirectBase?: string }): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Links erkennen und durch Click-Tracking ersetzen
  const linkRegex = /(https?:\/\/[^\s<>"']+)/g
  const html = escape(body)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')
    .replace(linkRegex, (url) => {
      if (opts.clickRedirectBase) {
        const tracked = `${opts.clickRedirectBase}?u=${encodeURIComponent(url)}`
        return `<a href="${tracked}" style="color:#2563eb;text-decoration:underline">${url}</a>`
      }
      return `<a href="${url}" style="color:#2563eb;text-decoration:underline">${url}</a>`
    })

  const pixel = opts.trackingPixelUrl
    ? `<img src="${opts.trackingPixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`
    : ''

  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55">
  <div style="max-width:620px;margin:0 auto;padding:24px"><p>${html}</p>${pixel}</div>
</body></html>`
}
