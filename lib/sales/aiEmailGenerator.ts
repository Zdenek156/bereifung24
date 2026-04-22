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
${senderName || 'Ihr Bereifung24-Team'}
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
- Stelle Bereifung24 in 1-2 Sätzen vor: "Wir bringen reine Reifen-Aufträge aus eurer Region zu lokalen Werkstätten – die Plattform-Nutzung ist für Werkstätten kostenlos, wir verdienen nur eine kleine Provision pro tatsächlich vermitteltem Termin."
- Nimm 2-3 passende Mehrwerte aus der "WAS BEREIFUNG24 BIETET"-Liste und verpacke sie kurz im Fließtext.
- WICHTIG: Erwähne KEIN Telefonat, KEINE Probelistung, KEINE kostenlose Aufnahme (das ist Standard).
- CTA: Verweise auf https://bereifung24.de/werkstatt für unverbindliche Anmeldung und weitere Infos.
- Maximal 160 Wörter`
      break
    case 'FOLLOWUP':
      intent = `Schreibe eine FOLLOW-UP-Email (höfliches Nachhaken nach ~5-7 Tagen ohne Antwort).
- Bezug auf die vorherige Email
- EIN neuer Mehrwert-Punkt aus der "WAS BEREIFUNG24 BIETET"-Liste, der in der Erstmail noch NICHT erwähnt wurde
- Sehr kurz (max 90 Wörter)
- Soft CTA: Link zu https://bereifung24.de/werkstatt
- KEIN Telefonat anbieten, KEINE Probelistung erwähnen.`
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

WAS BEREIFUNG24 BIETET (kostenlos für die Werkstatt):
- Reifenaufträge aus der Region (Reifenwechsel, Einlagerung, Neureifen)
- Eigene SEO-optimierte Werkstatt-Landingpage mit Online-Buchung → mehr Sichtbarkeit bei Google
- Kalender-Anbindung mit automatischer Blockierung & Eintrag von Terminen
- Festpreis-Hinterlegung für Services + Reifen-Preiskalkulation (Fix- und Prozent-Marge)
- Stripe-Integration: Geld liegt bereits VOR dem Termin bei der Werkstatt (kein Zahlungsausfall-Risiko)
- Widget-Cards für die eigene Webseite (Buchung direkt einbinden)
- Kundenbewertungen sammeln & öffentlich anzeigen
- Komplett kostenlos – nur eine kleine Provision pro tatsächlich vermitteltem Termin

WICHTIG zur Verwendung dieser Liste:
- NIEMALS alle Punkte aufzählen – wirkt aufdringlich.
- Wähle 2-3 Punkte aus, die zum Profil der Werkstatt passen (siehe Insights/USPs/Verbesserungspotenzial).
- Verpacke sie natürlich im Fließtext, nicht als Bullet-Liste.

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

  // Signatur immer anhängen, außer der KI-Body endet bereits mit einer Grußformel
  const hasGreeting = /\n\s*(Beste Grüße|Mit freundlichen Grüßen|Viele Grüße|Freundliche Grüße)\b/i.test(body)
  if (!hasGreeting) {
    body = body.replace(/\s+$/g, '') + SIGNATURE()
  }

  return {
    subject: subject.slice(0, 200),
    body: body.slice(0, 5000),
  }
}

/**
 * Wandelt Plaintext-Body in versandfähiges HTML um (mit Tracking-Pixel + Link-Tracking).
 * Erzeugt ein professionell gebrandetes HTML-Template mit Logo, Signatur-Karte und Markenfarben.
 */
export function bodyToHtml(
  body: string,
  opts: { trackingPixelUrl?: string; clickRedirectBase?: string; senderName?: string; senderRole?: string }
): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Body in "Inhalt" und "Signatur" splitten (Signatur beginnt bei Grußformel)
  const greetingRegex = /\n\s*\n(?=(?:Beste Grüße|Mit freundlichen Grüßen|Viele Grüße|Freundliche Grüße)\b)/i
  const split = body.split(greetingRegex)
  const contentRaw = (split[0] || body).trim()
  const signatureRaw = split.length > 1 ? split.slice(1).join('\n\n').trim() : ''

  const linkRegex = /(https?:\/\/[^\s<>"']+)/g
  const renderLinks = (text: string) =>
    escape(text).replace(linkRegex, (url) => {
      const target = opts.clickRedirectBase
        ? `${opts.clickRedirectBase}?u=${encodeURIComponent(url)}`
        : url
      return `<a href="${target}" style="color:#0284c7;text-decoration:underline">${url}</a>`
    })

  const contentHtml = renderLinks(contentRaw)
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px 0;color:#0f172a;font-size:15px;line-height:1.6">${para.replace(/\n/g, '<br />')}</p>`)
    .join('')

  // Signatur-Zeilen parsen: erste = Grußformel, zweite = Name, danach Rolle/Firma/Kontakt
  const sigLines = signatureRaw.split('\n').map((l) => l.trim()).filter(Boolean)
  const greeting = sigLines[0] || 'Beste Grüße'
  const name = sigLines[1] || opts.senderName || 'Bereifung24-Team'
  const restLines = sigLines.slice(2)
  // Rolle = erste Zeile nach Name, falls nicht Firma/Email/URL ist
  let role = opts.senderRole || ''
  let contactLines = restLines
  if (!role && restLines.length > 0 && !/@|https?:\/\/|GmbH|Bereifung24/i.test(restLines[0])) {
    role = restLines[0]
    contactLines = restLines.slice(1)
  }

  const renderContactLine = (line: string) => {
    const escaped = escape(line)
    if (/^https?:\/\//i.test(line)) {
      return `<a href="${line}" style="color:#0284c7;text-decoration:none">${escaped}</a>`
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) {
      return `<a href="mailto:${line}" style="color:#0284c7;text-decoration:none">${escaped}</a>`
    }
    return escaped
  }

  const contactHtml = contactLines
    .map((l) => `<div style="color:#475569;font-size:13px;line-height:1.5">${renderContactLine(l)}</div>`)
    .join('')

  const pixel = opts.trackingPixelUrl
    ? `<img src="${opts.trackingPixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Bereifung24</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.06)">
          <!-- Header mit Brand-Bar (bgcolor für Outlook-Kompatibilität, gradient als Progressive Enhancement) -->
          <tr>
            <td bgcolor="#0284c7" style="background:#0284c7;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);padding:24px 32px;text-align:left;color:#ffffff">
              <div style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.3px;line-height:1.1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Bereifung24</div>
              <div style="color:#e0f2fe;font-size:13px;margin-top:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Reifenservice-Vermittlung für Werkstätten</div>
            </td>
          </tr>

          <!-- Inhalt -->
          <tr>
            <td style="padding:32px">
              ${contentHtml}
            </td>
          </tr>

          <!-- Signatur (ohne Kreis-Avatar) -->
          <tr>
            <td style="padding:0 32px 28px 32px">
              <div style="border-top:3px solid #0284c7;padding-top:18px">
                <div style="color:#0f172a;font-size:16px;font-weight:600;line-height:1.3">${escape(name)}</div>
                ${role ? `<div style="color:#0284c7;font-size:13px;font-weight:500;margin-top:2px">${escape(role)}</div>` : ''}
                <div style="margin-top:10px">${contactHtml}</div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0">
              <div style="color:#64748b;font-size:11px;line-height:1.5;text-align:center">
                Bereifung24 · Reifenservice-Vermittlung &amp; Werkstattnetzwerk<br />
                <a href="https://bereifung24.de" style="color:#0284c7;text-decoration:none">bereifung24.de</a>
                · <a href="https://bereifung24.de/impressum" style="color:#64748b;text-decoration:none">Impressum</a>
                · <a href="https://bereifung24.de/datenschutz" style="color:#64748b;text-decoration:none">Datenschutz</a>
              </div>
            </td>
          </tr>
        </table>
        ${pixel}
      </td>
    </tr>
  </table>
</body>
</html>`
}
