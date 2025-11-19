import nodemailer from 'nodemailer'

// Email Transporter erstellen
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true für Port 465, false für andere Ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    // Wenn Email nicht konfiguriert ist, logge nur
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.log('📧 Email würde gesendet werden (nicht konfiguriert):')
      console.log(`   An: ${to}`)
      console.log(`   Betreff: ${subject}`)
      console.log(`   Inhalt: ${text || html.substring(0, 100)}...`)
      return { success: true, messageId: 'development-mode' }
    }

    const info = await transporter.sendMail({
      from: `"Bereifung24" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    })

    console.log('📧 Email gesendet:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email-Versand fehlgeschlagen:', error)
    throw error
  }
}

// Email-Templates

export function newOfferEmailTemplate(data: {
  customerName: string
  workshopName: string
  tireBrand: string
  tireModel: string
  tireSpecs: string
  price: number
  requestId: string
}) {
  const subject = `Neues Angebot für Ihre Reifenanfrage - ${data.tireBrand} ${data.tireModel}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .offer-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #1e40af; border-radius: 4px; }
        .price { font-size: 32px; font-weight: bold; color: #1e40af; margin: 10px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Neues Angebot verfügbar!</h1>
        </div>
        <div class="content">
          <p>Hallo ${data.customerName},</p>
          
          <p>Sie haben ein neues Angebot für Ihre Reifenanfrage erhalten!</p>
          
          <div class="offer-box">
            <h2 style="margin-top: 0; color: #1e40af;">Angebot von ${data.workshopName}</h2>
            
            <p><strong>Reifen:</strong> ${data.tireBrand} ${data.tireModel}</p>
            <p><strong>Dimension:</strong> ${data.tireSpecs}</p>
            
            <div class="price">${data.price.toFixed(2)} €</div>
            <p style="color: #6b7280; font-size: 14px;">inkl. Montage</p>
          </div>
          
          <p>Schauen Sie sich das vollständige Angebot in Ihrem Dashboard an und nehmen Sie es an, wenn es Ihnen zusagt.</p>
          
          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/customer/requests/${data.requestId}" class="button">
              Angebot jetzt ansehen
            </a>
          </center>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            <strong>Tipp:</strong> Vergleichen Sie mehrere Angebote, bevor Sie sich entscheiden!
          </p>
        </div>
        <div class="footer">
          <p>Bereifung24 - Ihre Online-Plattform für Reifenservice</p>
          <p>Bei Fragen erreichen Sie uns unter info@bereifung24.de</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${data.customerName},

Sie haben ein neues Angebot erhalten!

Werkstatt: ${data.workshopName}
Reifen: ${data.tireBrand} ${data.tireModel}
Dimension: ${data.tireSpecs}
Preis: ${data.price.toFixed(2)} € (inkl. Montage)

Sehen Sie sich das Angebot an: ${process.env.NEXTAUTH_URL}/dashboard/customer/requests/${data.requestId}

Beste Grüße,
Ihr Bereifung24-Team
  `

  return { subject, html, text }
}

export function offerAcceptedEmailTemplate(data: {
  workshopName: string
  customerName: string
  tireBrand: string
  tireModel: string
  tireSpecs: string
  price: number
  customerPhone?: string
  customerEmail: string
}) {
  const subject = `✅ Ihr Angebot wurde angenommen - ${data.customerName}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #059669; border-radius: 4px; }
        .customer-info { background: #ecfdf5; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .highlight { font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Glückwunsch!</h1>
          <h2 style="margin: 10px 0;">Ihr Angebot wurde angenommen</h2>
        </div>
        <div class="content">
          <p>Hallo ${data.workshopName},</p>
          
          <p>Großartige Neuigkeiten! Ein Kunde hat Ihr Angebot angenommen.</p>
          
          <div class="info-box">
            <h2 style="margin-top: 0; color: #059669;">Angebotsinformationen</h2>
            
            <p><strong>Reifen:</strong> ${data.tireBrand} ${data.tireModel}</p>
            <p><strong>Dimension:</strong> ${data.tireSpecs}</p>
            <div class="highlight">${data.price.toFixed(2)} €</div>
            <p style="color: #6b7280; font-size: 14px;">inkl. Montage</p>
          </div>
          
          <div class="customer-info">
            <h3 style="margin-top: 0; color: #059669;">Kundenkontakt</h3>
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>E-Mail:</strong> <a href="mailto:${data.customerEmail}">${data.customerEmail}</a></p>
            ${data.customerPhone ? `<p><strong>Telefon:</strong> ${data.customerPhone}</p>` : ''}
          </div>
          
          <p><strong>Nächste Schritte:</strong></p>
          <ul>
            <li>Der Kunde wird nun einen Termin für die Montage buchen</li>
            <li>Sie erhalten eine weitere Benachrichtigung, sobald der Termin feststeht</li>
            <li>Bereiten Sie die bestellten Reifen vor</li>
          </ul>
          
          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop/appointments" class="button">
              Zu meinen Terminen
            </a>
          </center>
        </div>
        <div class="footer">
          <p>Bereifung24 - Ihre Online-Plattform für Reifenservice</p>
          <p>Bei Fragen erreichen Sie uns unter info@bereifung24.de</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Glückwunsch ${data.workshopName}!

Ihr Angebot wurde angenommen:

Reifen: ${data.tireBrand} ${data.tireModel}
Dimension: ${data.tireSpecs}
Preis: ${data.price.toFixed(2)} €

Kundenkontakt:
Name: ${data.customerName}
E-Mail: ${data.customerEmail}
${data.customerPhone ? `Telefon: ${data.customerPhone}` : ''}

Der Kunde wird nun einen Termin buchen. Sie erhalten eine weitere Benachrichtigung.

Dashboard: ${process.env.NEXTAUTH_URL}/dashboard/workshop/appointments

Beste Grüße,
Ihr Bereifung24-Team
  `

  return { subject, html, text }
}
