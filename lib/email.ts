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

export function welcomeCustomerEmailTemplate(data: {
  firstName: string
  email: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .feature:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Willkommen bei Bereifung24!</h1>
        </div>
        <div class="content">
          <p><strong>Hallo ${data.firstName},</strong></p>
          <p>Vielen Dank für deine Registrierung bei Bereifung24! Wir freuen uns, dich auf unserer Plattform begrüßen zu dürfen.</p>
          
          <div class="features">
            <h3>Das kannst du jetzt tun:</h3>
            <div class="feature">Reifenpreise von Werkstätten in deiner Nähe vergleichen</div>
            <div class="feature">Direkt online Angebote anfordern</div>
            <div class="feature">Fahrzeuge verwalten und Daten speichern</div>
            <div class="feature">Termine bequem vereinbaren</div>
            <div class="feature">Bewertungen lesen und schreiben</div>
            <div class="feature">Deine Reifen-Historie verwalten</div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://bereifung24.de'}/login" class="button">
              Jetzt anmelden
            </a>
          </div>

          <p>Deine Login-Daten:</p>
          <ul>
            <li><strong>E-Mail:</strong> ${data.email}</li>
            <li><strong>Passwort:</strong> Das von dir gewählte Passwort</li>
          </ul>

          <p>Bei Fragen stehen wir dir gerne zur Verfügung!</p>
          <p>Viel Erfolg beim Finden der besten Reifen!</p>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
          <p>Deine Plattform für Reifenwechsel und mehr</p>
          <p style="margin-top: 10px;">
            <a href="${process.env.NEXTAUTH_URL || 'https://bereifung24.de'}" style="color: #667eea;">bereifung24.de</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function customerVerificationEmailTemplate(data: {
  firstName: string
  verificationUrl: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .button:hover { background: #5a67d8; }
        .info-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bestätige deine E-Mail-Adresse</h1>
        </div>
        <div class="content">
          <p><strong>Hallo ${data.firstName},</strong></p>
          <p>Vielen Dank für deine Registrierung bei Bereifung24!</p>
          <p>Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren und dich anmelden zu können.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" class="button">
              E-Mail-Adresse bestätigen
            </a>
          </div>

          <div class="info-box">
            <p style="margin: 0;"><strong>Hinweis:</strong> Dieser Link ist nur einmalig verwendbar. Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
          </div>

          <p>Alternativ kannst du auch folgenden Link in deinen Browser kopieren:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${data.verificationUrl}</p>

          <p style="margin-top: 30px;">Bei Fragen stehen wir dir gerne zur Verfügung!</p>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
          <p>Deine Plattform für Reifenwechsel und mehr</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function welcomeWorkshopEmailTemplate(data: {
  firstName: string
  lastName: string
  companyName: string
  email: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .feature:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Willkommen bei Bereifung24!</h1>
        </div>
        <div class="content">
          <p><strong>Hallo Herr ${data.lastName},</strong></p>
          <p>Herzlichen Glückwunsch! Ihre Werkstatt <strong>${data.companyName}</strong> wurde erfolgreich bei Bereifung24 registriert.</p>
          
          <div class="alert">
            <strong>Verifizierung erforderlich</strong><br>
            Ihr Account wird derzeit von unserem Team geprüft. Sie erhalten eine weitere E-Mail, sobald Ihr Account freigeschaltet wurde.
          </div>

          <div class="features">
            <h3>Nach der Freischaltung können Sie:</h3>
            <div class="feature">Anfragen von Kunden in Ihrer Nähe erhalten</div>
            <div class="feature">Angebote direkt über die Plattform erstellen</div>
            <div class="feature">Termine online verwalten</div>
            <div class="feature">Bewertungen sammeln</div>
          </div>

          <p>Ihre Login-Daten:</p>
          <ul>
            <li><strong>E-Mail:</strong> ${data.email}</li>
            <li><strong>Passwort:</strong> Das von Ihnen gewählte Passwort</li>
          </ul>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
          <p>Partner-Plattform für Werkstätten</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function workshopVerifiedEmailTemplate(data: {
  firstName: string
  lastName: string
  companyName: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account freigeschaltet!</h1>
        </div>
        <div class="content">
          <p><strong>Hallo Herr ${data.lastName},</strong></p>
          
          <div class="success">
            <strong>Großartige Neuigkeiten!</strong><br>
            Ihre Werkstatt <strong>${data.companyName}</strong> wurde erfolgreich verifiziert!
          </div>

          <p>Ab sofort können Sie Kundenanfragen empfangen und Angebote erstellen.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'https://bereifung24.de'}/login" class="button">
              Zum Dashboard
            </a>
          </div>

          <p>Viel Erfolg mit Bereifung24!</p>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function newOfferEmailTemplate(data: {
  customerName: string
  workshopName: string
  tireBrand: string
  tireModel: string
  tireSpecs: string
  price: number
  requestId: string
  motorcycleTireType?: string
}) {
  // Format motorcycle tire type for display
  let tireTypeLabel = ''
  if (data.motorcycleTireType === 'FRONT') {
    tireTypeLabel = ' (Nur Vorderreifen)'
  } else if (data.motorcycleTireType === 'REAR') {
    tireTypeLabel = ' (Nur Hinterreifen)'
  } else if (data.motorcycleTireType === 'BOTH') {
    tireTypeLabel = ' (Beide Reifen)'
  }
  
  const subject = `Neues Angebot für Ihre Reifenanfrage - ${data.tireBrand} ${data.tireModel}${tireTypeLabel}`
  
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
          <h1>Neues Angebot verfügbar!</h1>
        </div>
        <div class="content">
          <p>Hallo ${data.customerName},</p>
          
          <p>Sie haben ein neues Angebot für Ihre Reifenanfrage erhalten!</p>
          
          <div class="offer-box">
            <h2 style="margin-top: 0; color: #1e40af;">Angebot von ${data.workshopName}</h2>
            
            <p><strong>Reifen:</strong> ${data.tireBrand} ${data.tireModel}</p>
            <p><strong>Dimension:</strong> ${data.tireSpecs}</p>
            ${tireTypeLabel ? `<p style="background: #eff6ff; padding: 8px; border-radius: 4px; color: #1e40af; font-weight: 600;">🏍️ ${tireTypeLabel.replace(/[()]/g, '')}</p>` : ''}
            
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
Dimension: ${data.tireSpecs}${tireTypeLabel ? '\n' + tireTypeLabel : ''}
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
  const subject = `Ihr Angebot wurde angenommen - ${data.customerName}`
  
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
          <h1>Glückwunsch!</h1>
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

// Admin Notification Templates

export function adminCustomerRegistrationEmailTemplate(data: {
  customerName: string
  email: string
  phone?: string
  city?: string
  registrationDate: string
}) {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Neue Kunden-Registrierung</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Bereifung24 Admin-Benachrichtigung</p>
        </div>
        <div class="content">
          <p><strong>Es hat sich ein neuer Kunde registriert:</strong></p>
          
          <div class="info-box">
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>E-Mail:</strong> ${data.email}</p>
            ${data.phone ? `<p><strong>Telefon:</strong> ${data.phone}</p>` : ''}
            ${data.city ? `<p><strong>Stadt:</strong> ${data.city}</p>` : ''}
            <p><strong>Registriert am:</strong> ${data.registrationDate}</p>
          </div>
          
          <center>
            <a href="${process.env.NEXTAUTH_URL}/admin/customers" class="button">
              Zur Kundenverwaltung
            </a>
          </center>
        </div>
        <div class="footer">
          <p>Bereifung24 - Admin-Benachrichtigung</p>
          <p>Diese E-Mail wurde automatisch generiert</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function adminWorkshopRegistrationEmailTemplate(data: {
  workshopName: string
  companyName: string
  email: string
  phone?: string
  city?: string
  registrationDate: string
  workshopId: string
}) {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Neue Werkstatt-Registrierung</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Bereifung24 Admin-Benachrichtigung</p>
        </div>
        <div class="content">
          <div class="alert">
            <strong>Aktion erforderlich:</strong> Diese Werkstatt muss manuell freigeschaltet werden.
          </div>
          
          <p><strong>Es hat sich eine neue Werkstatt registriert:</strong></p>
          
          <div class="info-box">
            <p><strong>Firma:</strong> ${data.companyName}</p>
            <p><strong>Ansprechpartner:</strong> ${data.workshopName}</p>
            <p><strong>E-Mail:</strong> ${data.email}</p>
            ${data.phone ? `<p><strong>Telefon:</strong> ${data.phone}</p>` : ''}
            ${data.city ? `<p><strong>Stadt:</strong> ${data.city}</p>` : ''}
            <p><strong>Registriert am:</strong> ${data.registrationDate}</p>
          </div>
          
          <p><strong>Nächste Schritte:</strong></p>
          <ul>
            <li>Überprüfen Sie die Werkstatt-Daten</li>
            <li>Schalten Sie die Werkstatt frei, wenn alles korrekt ist</li>
            <li>Die Werkstatt erhält automatisch eine Benachrichtigungs-E-Mail bei Freischaltung</li>
          </ul>
          
          <center>
            <a href="${process.env.NEXTAUTH_URL}/admin/workshops" class="button">
              Werkstatt jetzt prüfen
            </a>
          </center>
        </div>
        <div class="footer">
          <p>Bereifung24 - Admin-Benachrichtigung</p>
          <p>Diese E-Mail wurde automatisch generiert</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function newTireRequestEmailTemplate(data: {
  workshopName: string
  requestId: string
  season: string
  tireSize: string
  quantity: number
  needByDate: string
  distance: string
  preferredBrands?: string
  additionalNotes?: string
  customerCity?: string
  vehicleInfo?: string
}) {
  const seasonText = data.season === 'SUMMER' ? 'Sommerreifen' : 
                     data.season === 'WINTER' ? 'Winterreifen' : 'Ganzjahresreifen'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .tire-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #4b5563; }
        .detail-value { color: #1f2937; }
        .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .button:hover { box-shadow: 0 6px 8px rgba(0,0,0,0.15); }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
        .urgency { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; border-radius: 4px; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Neue Reifenanfrage in Ihrer Nähe!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Ein Kunde sucht Reifen in Ihrem Umkreis</p>
        </div>
        <div class="content">
          <p><strong>Hallo Herr ${data.workshopName},</strong></p>
          
          <p>Es gibt eine neue Reifenanfrage in Ihrer Nähe! Ein Kunde sucht ${seasonText} und Sie haben die Möglichkeit, ein Angebot zu erstellen.</p>
          
          <div class="highlight">
            <strong>📍 Entfernung:</strong> Ca. ${data.distance} von Ihrem Standort<br>
            ${data.customerCity ? `<strong>Stadt:</strong> ${data.customerCity}<br>` : ''}
            <strong>📅 Benötigt bis:</strong> ${data.needByDate}
          </div>

          <div class="tire-details">
            <h2 style="margin-top: 0; color: #667eea;">Anfrage-Details</h2>
            
            ${data.vehicleInfo ? `
            <div class="detail-row">
              <span class="detail-label">Fahrzeug: </span>
              <span class="detail-value">${data.vehicleInfo}</span>
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="detail-label">Saison: </span>
              <span class="detail-value">${seasonText}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Reifengröße: </span>
              <span class="detail-value">${data.tireSize}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Menge: </span>
              <span class="detail-value">${data.quantity} Reifen</span>
            </div>
            
            ${data.preferredBrands ? `
            <div class="detail-row">
              <span class="detail-label">Bevorzugte Marken:</span>
              <span class="detail-value">${data.preferredBrands}</span>
            </div>
            ` : ''}
            
            ${data.additionalNotes ? `
            <div class="detail-row">
              <span class="detail-label">Zusätzliche Hinweise:</span>
              <span class="detail-value">${data.additionalNotes}</span>
            </div>
            ` : ''}
          </div>

          <div class="urgency">
            <strong>⏰ Jetzt reagieren und Angebot erstellen!</strong><br>
            Je schneller Sie reagieren, desto höher sind Ihre Chancen, den Auftrag zu erhalten.
          </div>

          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop/browse-requests" class="button">
              Jetzt Angebot erstellen
            </a>
          </center>

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>Hinweis:</strong> Sie können Ihr Angebot direkt in Ihrem Dashboard erstellen. 
            Der Kunde wird über alle eingegangenen Angebote informiert und kann dann das beste Angebot auswählen.
          </p>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
          <p>Ihre Plattform für Reifenwechsel und mehr</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Buchungsbestätigung - Kunde
export function bookingConfirmationCustomerEmailTemplate(data: {
  customerName: string
  workshopName: string
  workshopAddress: string
  workshopPhone: string
  appointmentDate: string
  appointmentTime: string
  tireBrand: string
  tireModel: string
  tireSize: string
  totalPrice: number
  paymentMethod: string
  bookingId: string
  workshopEmail?: string
  customerNotes?: string
}) {
  const paymentMethodText = data.paymentMethod === 'PAY_ONSITE' 
    ? 'Zahlung vor Ort' 
    : data.paymentMethod === 'PAY_ONLINE' 
    ? 'Online-Zahlung' 
    : data.paymentMethod

  return {
    subject: 'Terminbestätigung - Ihr Reifenwechsel bei ' + data.workshopName,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; }
        .appointment-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .detail-row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .workshop-box { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .price-box { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Termin erfolgreich gebucht!</h1>
        </div>
        <div class="content">
          <p><strong>Hallo ${data.customerName},</strong></p>
          
          <p>Vielen Dank für Ihre Buchung! Ihr Termin wurde erfolgreich bestätigt.</p>

          <div class="appointment-box">
            <h2 style="margin-top: 0; color: #059669;">📅 Ihr Termin</h2>
            <div class="detail-row">
              <span class="detail-label">Datum:</span>
              <span class="detail-value">${data.appointmentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Uhrzeit:</span>
              <span class="detail-value">${data.appointmentTime} Uhr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Buchungsnummer:</span>
              <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div class="workshop-box">
            <h3 style="margin-top: 0; color: #667eea;">🏢 Werkstatt</h3>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${data.workshopName}</p>
            <p style="margin: 5px 0;">📍 ${data.workshopAddress}</p>
            <p style="margin: 5px 0;">📞 ${data.workshopPhone}</p>
            ${data.workshopEmail ? `<p style="margin: 5px 0;">✉️ ${data.workshopEmail}</p>` : ''}
          </div>

          <h3 style="color: #667eea;">🚗 Ihre Reifen</h3>
          <div class="detail-row">
            <span class="detail-label">Marke & Modell:</span>
            <span class="detail-value">${data.tireBrand} ${data.tireModel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Größe:</span>
            <span class="detail-value">${data.tireSize}</span>
          </div>

          <div class="price-box">
            <h2 style="margin: 0;">Gesamtpreis</h2>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">${data.totalPrice.toFixed(2)} €</div>
            <p style="margin: 0; opacity: 0.9;">inkl. Montage</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Zahlungsart: ${paymentMethodText}</p>
          </div>

          ${data.customerNotes ? `
          <div class="appointment-box">
            <h3 style="margin-top: 0;">💬 Ihre Nachricht an die Werkstatt</h3>
            <p style="margin: 0;">${data.customerNotes}</p>
          </div>
          ` : ''}

          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/customer/bookings" class="button">
              Meine Buchungen ansehen
            </a>
          </center>

          <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <strong>⏰ Wichtig:</strong> Bitte erscheinen Sie pünktlich zu Ihrem Termin. 
            Bei Verspätung oder Verhinderung kontaktieren Sie bitte die Werkstatt direkt.
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Bei Fragen zu Ihrem Termin wenden Sie sich bitte direkt an die Werkstatt.
          </p>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
          <p>Ihre Plattform für Reifenwechsel und mehr</p>
        </div>
      </div>
    </body>
    </html>
  `
  }
}

// Buchungsbestätigung - Werkstatt
export function bookingConfirmationWorkshopEmailTemplate(data: {
  workshopName: string
  customerName: string
  customerPhone: string
  customerEmail: string
  customerAddress?: string
  appointmentDate: string
  appointmentTime: string
  tireBrand: string
  tireModel: string
  tireSize: string
  quantity: number
  totalPrice: number
  paymentMethod: string
  bookingId: string
  customerNotes?: string
  vehicleInfo?: string
}) {
  const paymentMethodText = data.paymentMethod === 'PAY_ONSITE' 
    ? 'Zahlung vor Ort' 
    : data.paymentMethod === 'PAY_ONLINE' 
    ? 'Online-Zahlung' 
    : data.paymentMethod

  return {
    subject: 'Neue Terminbuchung - ' + data.customerName,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; }
        .appointment-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .detail-row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .customer-box { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
          <h1>Neue Terminbuchung!</h1>
        </div>
        <div class="content">
          <p><strong>Hallo ${data.workshopName},</strong></p>
          
          <p>Sie haben eine neue Terminbuchung erhalten. Ein Kunde hat Ihr Angebot angenommen und einen Termin gebucht.</p>

          <div class="appointment-box">
            <h2 style="margin-top: 0; color: #3b82f6;">📅 Termin-Details</h2>
            <div class="detail-row">
              <span class="detail-label">Datum:</span>
              <span class="detail-value">${data.appointmentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Uhrzeit:</span>
              <span class="detail-value">${data.appointmentTime} Uhr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Buchungsnummer:</span>
              <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div class="customer-box">
            <h3 style="margin-top: 0; color: #667eea;">👤 Kunde</h3>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${data.customerName}</p>
            ${data.customerAddress ? `<p style="margin: 5px 0;">📍 ${data.customerAddress}</p>` : ''}
            <p style="margin: 5px 0;">📞 ${data.customerPhone}</p>
            <p style="margin: 5px 0;">✉️ ${data.customerEmail}</p>
            <p style="margin: 10px 0 5px 0; font-size: 12px; color: #6b7280;"><em>Wichtig: Diese Adresse kann für die Rechnungsstellung verwendet werden.</em></p>
          </div>

          <h3 style="color: #667eea;">🚗 Auftrags-Details</h3>
          ${data.vehicleInfo ? `
          <div class="detail-row">
            <span class="detail-label">Fahrzeug:</span>
            <span class="detail-value">${data.vehicleInfo}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Reifen:</span>
            <span class="detail-value">${data.tireBrand} ${data.tireModel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Größe:</span>
            <span class="detail-value">${data.tireSize}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Menge:</span>
            <span class="detail-value">${data.quantity} Reifen</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Gesamtpreis:</span>
            <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #059669;">${data.totalPrice.toFixed(2)} €</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Zahlungsart:</span>
            <span class="detail-value">${paymentMethodText}</span>
          </div>

          ${data.customerNotes ? `
          <div class="appointment-box">
            <h3 style="margin-top: 0;">💬 Nachricht vom Kunden</h3>
            <p style="margin: 0;">${data.customerNotes}</p>
          </div>
          ` : ''}

          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop/bookings" class="button">
              Alle Buchungen ansehen
            </a>
          </center>

          <p style="margin-top: 30px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <strong>📋 Nächste Schritte:</strong><br>
            - Reifen bestellen (falls noch nicht vorrätig)<br>
            - Termin im Kalender vormerken<br>
            - Bei Bedarf Kunde kontaktieren
          </p>
        </div>
        <div class="footer">
          <p><strong>Bereifung24</strong></p>
          <p>Ihre Plattform für Reifenwechsel und mehr</p>
        </div>
      </div>
    </body>
    </html>
  `
  }
}
