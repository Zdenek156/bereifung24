const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')
const prisma = new PrismaClient()

// Email template function
function influencerPaymentConfirmationEmailTemplate({
  influencerName,
  amount,
  periodStart,
  periodEnd,
  totalClicks,
  clicksAmount,
  totalRegistrations,
  registrationsAmount,
  totalOffers,
  offersAmount,
  paymentMethod,
  paymentReference,
  paidAt
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auszahlung durchgeführt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                💰 Auszahlung durchgeführt
              </h1>
            </td>
          </tr>
          
          <!-- Success Badge -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 16px;">
                ✅ Erfolgreich ausgezahlt
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hallo ${influencerName},
              </p>
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Ihre Auszahlung wurde erfolgreich durchgeführt! 🎉
              </p>
              
              <!-- Amount Box -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
                <div style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin-bottom: 8px;">Ausgezahlter Betrag</div>
                <div style="color: #ffffff; font-size: 42px; font-weight: 700;">${amount}</div>
              </div>
              
              <!-- Info Section -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Zeitraum:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${periodStart} - ${periodEnd}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Zahlungsmethode:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${paymentMethod === 'BANK_TRANSFER' ? 'Überweisung' : 'PayPal'}</td>
                  </tr>
                  ${paymentReference ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Transaktions-ID:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${paymentReference}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${paidAt}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Breakdown Section -->
              <div style="margin: 25px 0;">
                <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Zusammensetzung</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  ${totalClicks > 0 ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                      <div style="color: #374151; font-size: 14px;">Klicks (${totalClicks})</div>
                      <div style="color: #9ca3af; font-size: 12px;">CPM-Vergütung</div>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600; font-size: 16px;">${clicksAmount}</td>
                  </tr>
                  ` : ''}
                  ${totalRegistrations > 0 ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                      <div style="color: #374151; font-size: 14px;">Registrierungen (${totalRegistrations})</div>
                      <div style="color: #9ca3af; font-size: 12px;">Werkstatt-Registrierungen</div>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600; font-size: 16px;">${registrationsAmount}</td>
                  </tr>
                  ` : ''}
                  ${totalOffers > 0 ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                      <div style="color: #374151; font-size: 14px;">Akzeptierte Angebote (${totalOffers})</div>
                      <div style="color: #9ca3af; font-size: 12px;">Erfolgreich abgeschlossen</div>
                    </td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600; font-size: 16px;">${offersAmount}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- Tip Box -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>💡 Hinweis:</strong> Bei Überweisungen kann es 1-3 Werktage dauern, bis der Betrag auf Ihrem Konto eingeht.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 20px 0;">
                <a href="https://bereifung24.de/influencer/payments" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Auszahlungshistorie anzeigen
                </a>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Vielen Dank für Ihre Zusammenarbeit!
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Ihr Bereifung24 Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                Bei Fragen erreichen Sie uns unter <a href="mailto:info@bereifung24.de" style="color: #667eea; text-decoration: none;">info@bereifung24.de</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return {
    subject: 'Ihre Auszahlung wurde durchgeführt - Bereifung24',
    html
  }
}

async function getEmailSettings() {
  try {
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM']
        }
      }
    })

    const config = {}
    settings.forEach(setting => {
      switch (setting.key) {
        case 'EMAIL_HOST':
          config.host = setting.value
          break
        case 'EMAIL_PORT':
          config.port = parseInt(setting.value || '587')
          break
        case 'EMAIL_USER':
          config.user = setting.value
          break
        case 'EMAIL_PASSWORD':
          config.password = setting.value
          break
        case 'EMAIL_FROM':
          config.from = setting.value
          break
      }
    })

    return config
  } catch (error) {
    console.error('Fehler beim Laden der Email-Einstellungen:', error)
    return null
  }
}

async function sendTestEmail() {
  try {
    console.log('\n🔍 Suche letzte bezahlte Zahlung...\n')

    // Find last paid payment
    const payment = await prisma.affiliatePayment.findFirst({
      where: { status: 'PAID' },
      orderBy: { paidAt: 'desc' },
      include: {
        influencer: {
          select: {
            email: true,
            channelName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!payment) {
      console.log('❌ Keine bezahlte Zahlung gefunden!')
      process.exit(1)
    }

    console.log('✅ Zahlung gefunden:')
    console.log('   ID:', payment.id)
    console.log('   Influencer:', payment.influencer.email)
    console.log('   Betrag:', `€${(payment.totalAmount / 100).toFixed(2)}`)
    console.log('   Zeitraum:', new Date(payment.periodStart).toLocaleDateString('de-DE'), '-', new Date(payment.periodEnd).toLocaleDateString('de-DE'))
    console.log('')

    // Get email settings
    const config = await getEmailSettings()
    if (!config || !config.host) {
      console.log('❌ E-Mail-Einstellungen nicht konfiguriert!')
      process.exit(1)
    }

    console.log('📧 E-Mail-Konfiguration geladen')
    console.log('   Host:', config.host)
    console.log('   Port:', config.port)
    console.log('   From:', config.from)
    console.log('')

    // Prepare email data
    const influencerName = payment.influencer.firstName && payment.influencer.lastName
      ? `${payment.influencer.firstName} ${payment.influencer.lastName}`
      : payment.influencer.channelName || 'Influencer'

    const emailTemplate = influencerPaymentConfirmationEmailTemplate({
      influencerName,
      amount: `€${(payment.totalAmount / 100).toFixed(2)}`,
      periodStart: new Date(payment.periodStart).toLocaleDateString('de-DE'),
      periodEnd: new Date(payment.periodEnd).toLocaleDateString('de-DE'),
      totalClicks: payment.totalClicks,
      clicksAmount: `€${(payment.clicksAmount / 100).toFixed(2)}`,
      totalRegistrations: payment.totalRegistrations,
      registrationsAmount: `€${(payment.registrationsAmount / 100).toFixed(2)}`,
      totalOffers: payment.totalOffers,
      offersAmount: `€${(payment.offersAmount / 100).toFixed(2)}`,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference || undefined,
      paidAt: new Date(payment.paidAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
    })

    console.log('📤 Sende Test-E-Mail an:', payment.influencer.email)
    console.log('   Betreff:', emailTemplate.subject)
    console.log('')

    // Send email
    const info = await transporter.sendMail({
      from: `"Bereifung24" <${config.from}>`,
      to: payment.influencer.email,
      subject: '[TEST] ' + emailTemplate.subject,
      html: emailTemplate.html,
    })

    console.log('✅ E-Mail erfolgreich gesendet!')
    console.log('   Message ID:', info.messageId)
    console.log('   An:', payment.influencer.email)
    console.log('')
    console.log('🎉 Test abgeschlossen!')
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Fehler:', error)
    process.exit(1)
  }
}

sendTestEmail()
