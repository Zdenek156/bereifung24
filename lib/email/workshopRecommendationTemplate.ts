/**
 * Email-Template für Werkstatt-Empfehlungen
 *
 * Generiert ein im Bereifung24-Branding gehaltenes HTML-Template für
 * KI-generierte Optimierungsempfehlungen, inkl. CTA-Button und
 * Open/Click-Tracking.
 */

interface RecommendationEmailData {
  recipientName: string
  companyName: string
  bodyText: string         // KI-generierter Plain-Text (Absätze durch \n\n)
  ctaUrl: string           // CTA-Link mit Tracking-Wrapper
  ctaLabel?: string        // CTA-Button Text
  trackingPixelUrl: string // 1x1 Pixel URL
  senderName?: string      // Mitarbeiter-Name für Signatur
  senderEmail?: string
}

function paragraphsToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map(p => `<p style="margin: 0 0 16px 0;">${p.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/&lt;br&gt;/g, '<br>')}</p>`)
    .join('\n')
}

export function workshopRecommendationEmailTemplate(data: RecommendationEmailData): string {
  const ctaLabel = data.ctaLabel || 'Jetzt im Dashboard optimieren'
  const senderBlock = data.senderName
    ? `<p style="margin: 24px 0 4px 0;">Mit freundlichen Grüßen<br><strong>${data.senderName}</strong></p>
       <p style="margin: 0; color: #6b7280; font-size: 13px;">Bereifung24 · Account Management${data.senderEmail ? `<br><a href="mailto:${data.senderEmail}" style="color: #6b7280;">${data.senderEmail}</a>` : ''}</p>`
    : `<p style="margin: 24px 0 4px 0;">Mit freundlichen Grüßen<br><strong>Dein Bereifung24-Team</strong></p>`

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empfehlung von Bereifung24</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1f2937;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 36px 40px; text-align: left;">
              <div style="color: #ffffff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; margin-bottom: 8px;">Bereifung24 · Account Management</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; line-height: 1.3;">Persönliche Empfehlung für ${escapeHtml(data.companyName)}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; font-size: 15px; line-height: 1.65; color: #1f2937;">
              <p style="margin: 0 0 20px 0;">Hallo ${escapeHtml(data.recipientName)},</p>
              ${paragraphsToHtml(data.bodyText)}

              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 8px 0;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
                    <a href="${data.ctaUrl}"
                       style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px;">
                      ${escapeHtml(ctaLabel)} →
                    </a>
                  </td>
                </tr>
              </table>

              ${senderBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">
                <strong style="color: #0284c7;">Bereifung24</strong> · Deine Plattform für Reifenwechsel
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                <a href="https://bereifung24.de" style="color: #9ca3af; text-decoration: none;">bereifung24.de</a>
                · <a href="mailto:info@bereifung24.de" style="color: #9ca3af; text-decoration: none;">info@bereifung24.de</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #d1d5db;">
                Diese Email wurde individuell für Sie verfasst und enthält keine Werbung.
              </p>
            </td>
          </tr>
        </table>

        <!-- Tracking Pixel -->
        <img src="${data.trackingPixelUrl}" width="1" height="1" alt="" style="display: block; width: 1px; height: 1px; opacity: 0;" />
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
