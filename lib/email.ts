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
          <p><strong>Hallo ${data.firstName},</strong></p>
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
          <p><strong>Hallo ${data.firstName},</strong></p>
          
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
          <h1>Neues Angebot verfügbar!</h1>
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
