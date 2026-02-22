import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { canSendBookingEmail } from './email-rate-limiter'

// Helper function to get template from database by key
export async function getEmailTemplate(templateKey: string) {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { key: templateKey, isActive: true }
    })
    return template
  } catch (error) {
    console.error(`Error loading email template ${templateKey}:`, error)
    return null
  }
}

// Helper function to replace placeholders in template
export function replacePlaceholders(content: string, data: Record<string, any>): string {
  let result = content
  
  // Replace all {{key}} placeholders with actual values
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    const value = data[key] !== null && data[key] !== undefined ? String(data[key]) : ''
    result = result.replace(regex, value)
  })
  
  return result
}

// Send email using template from database (with fallback to hard-coded templates)
export async function sendTemplateEmail(
  templateKey: string, 
  to: string, 
  data: Record<string, any>,
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>,
  fallbackTemplate?: { subject: string, html: string }
) {
  try {
    // Try to get template from database first
    const template = await getEmailTemplate(templateKey)
    
    let subject: string
    let html: string

    if (template) {
      // Use database template
      subject = replacePlaceholders(template.subject, data)
      html = replacePlaceholders(template.htmlContent, data)
    } else if (fallbackTemplate) {
      // Use provided fallback template (hard-coded)
      console.log(`⚠️ Using fallback template for ${templateKey} (not found in DB)`)
      subject = fallbackTemplate.subject
      html = fallbackTemplate.html
    } else {
      // No template available
      console.error(`Email template ${templateKey} not found and no fallback provided`)
      throw new Error(`Email template ${templateKey} not found`)
    }

    // Send email
    return await sendEmail({
      to,
      subject,
      html,
      attachments
    })
  } catch (error) {
    console.error('Error sending template email:', error)
    throw error
  }
}

// Email Settings aus Datenbank holen
async function getEmailSettings() {
  try {
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM']
        }
      }
    })

    const config: any = {}
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
    console.error('Fehler beim Laden der Email-Einstellungen aus DB:', error)
    // Fallback zu Umgebungsvariablen
    return {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      from: process.env.EMAIL_FROM,
    }
  }
}

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export async function sendEmail({ to, subject, text, html, attachments }: EmailOptions) {
  try {
    // Hole Email-Settings aus Datenbank
    const config = await getEmailSettings()

    console.log('[EMAIL] Config loaded:', {
      host: config.host,
      port: config.port,
      user: config.user,
      passwordSet: !!config.password,
      from: config.from
    })

    // Wenn Email nicht konfiguriert ist, logge nur
    if (!config.host || !config.user) {
      console.log('📧 Email würde gesendet werden (nicht konfiguriert):')
      console.log(`   An: ${to}`)
      console.log(`   Betreff: ${subject}`)
      console.log(`   Inhalt: ${text || html.substring(0, 100)}...`)
      return { success: true, messageId: 'development-mode' }
    }

    // ANTI-SPAM: Rate limiting check
    if (!canSendBookingEmail(to)) {
      console.warn(`[EMAIL RATE LIMIT] Blocked email to ${to} - too many emails in short time`)
      return { 
        success: false, 
        messageId: 'rate-limited',
        error: 'Rate limit exceeded - zu viele Emails in kurzer Zeit'
      }
    }

    // Transporter mit aktuellen Settings erstellen
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true für Port 465, false für andere
      auth: {
        user: config.user,
        pass: config.password,
      },
    })

    const info = await transporter.sendMail({
      from: `"Bereifung24" <${config.from}>`,
      to,
      subject,
      text,
      html,
      attachments,
    })

    console.log('📧 Email gesendet:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email-Versand fehlgeschlagen:', error)
    throw error
  }
}

// Helper function to create ICS calendar file
export function createICSFile(data: {
  start: Date
  end: Date
  summary: string
  description: string
  location: string
  organizerEmail: string
  organizerName?: string
  attendeeEmail?: string
  attendeeName?: string
}): string {
  // Format date to UTC with Z suffix for unambiguous timezone handling
  // This ensures all calendar clients interpret the time correctly and
  // handle daylight saving time (DST) transitions automatically
  const formatDateUTC = (date: Date): string => {
    // Convert to UTC format: YYYYMMDDTHHMMSSZ
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hour = String(date.getUTCHours()).padStart(2, '0')
    const minute = String(date.getUTCMinutes()).padStart(2, '0')
    const second = String(date.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hour}${minute}${second}Z`
  }

  const escapeICS = (text: string): string => {
    return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }

  const now = new Date()
  const uid = `${now.getTime()}@bereifung24.de`
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bereifung24//Booking System//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateUTC(now)}`,
    `DTSTART:${formatDateUTC(data.start)}`,
    `DTEND:${formatDateUTC(data.end)}`,
    `SEQUENCE:0`,
    `SUMMARY:${escapeICS(data.summary)}`,
    `DESCRIPTION:${escapeICS(data.description)}`,
    `LOCATION:${escapeICS(data.location)}`,
    `STATUS:CONFIRMED`,
    `ORGANIZER;CN="${escapeICS(data.organizerName || data.organizerEmail)}":mailto:${data.organizerEmail}`,
  ]

  if (data.attendeeEmail) {
    icsContent.push(`ATTENDEE;CN="${escapeICS(data.attendeeName || data.attendeeEmail)}";RSVP=TRUE:mailto:${data.attendeeEmail}`)
  }

  icsContent.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Erinnerung: Termin in 1 Stunde',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  )

  return icsContent.join('\r\n')
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
  tireOptions: Array<{
    brand: string
    model: string
    pricePerTire: number
    motorcycleTireType?: string | null
    carTireType?: string | null
  }>
  tireSpecs: string
  price: number
  requestId: string
  quantity: number
  installationFee: number
}) {
  // Format motorcycle tire type for display
  const formatTireType = (type?: string | null, isMotorcycle: boolean = true) => {
    if (isMotorcycle) {
      if (type === 'FRONT') return '🏍️ Nur Vorderreifen'
      if (type === 'REAR') return '🏍️ Nur Hinterreifen'
      if (type === 'BOTH') return '🏍️ Beide Reifen'
    } else {
      if (type === 'ALL_FOUR') return '🚗 Alle 4 Reifen'
      if (type === 'FRONT_TWO') return '🚗 2 Vorderreifen'
      if (type === 'REAR_TWO') return '🚗 2 Hinterreifen'
    }
    return ''
  }
  
  const firstOption = data.tireOptions[0]
  const subject = `Neues Angebot für Ihre Reifenanfrage - ${firstOption.brand} ${firstOption.model}${firstOption.motorcycleTireType ? ` (${formatTireType(firstOption.motorcycleTireType)})` : ''}`
  
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
            
            <p><strong>Dimension:</strong> ${data.tireSpecs}</p>
            
            ${data.tireOptions.map(option => {
              // Berechne Anzahl basierend auf carTireType/motorcycleTireType
              let tireCount = data.quantity
              if (option.carTireType === 'FRONT_TWO' || option.carTireType === 'REAR_TWO') {
                tireCount = 2
              } else if (option.carTireType === 'ALL_FOUR') {
                tireCount = 4
              } else if (option.motorcycleTireType === 'FRONT' || option.motorcycleTireType === 'REAR') {
                tireCount = 1
              } else if (option.motorcycleTireType === 'BOTH') {
                tireCount = 2
              }
              
              // Berechne anteilige Montagekosten: (Montage / Gesamt-Reifen) * Diese-Reifen
              const installationPerOption = (data.installationFee / data.quantity) * tireCount
              const tiresTotal = option.pricePerTire * tireCount
              const optionPrice = tiresTotal + installationPerOption
              
              const tireTypeLabel = option.motorcycleTireType 
                ? formatTireType(option.motorcycleTireType, true)
                : option.carTireType 
                  ? formatTireType(option.carTireType, false)
                  : ''
              return `
                <div style="background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 4px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 5px 0;"><strong>Reifen:</strong> ${option.brand} ${option.model}</p>
                  ${tireTypeLabel ? `<p style="margin: 5px 0; background: #eff6ff; padding: 6px; border-radius: 4px; color: #1e40af; font-weight: 600; display: inline-block;">${tireTypeLabel}</p>` : ''}
                  <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #1e40af;">${optionPrice.toFixed(2)} € <span style="font-size: 14px; color: #6b7280; font-weight: normal;">inkl. Montage</span></p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">${tireCount} Reifen á ${option.pricePerTire.toFixed(2)} € + Montage ${installationPerOption.toFixed(2)} €</p>
                </div>
              `
            }).join('')}
            
            ${data.tireOptions.length > 1 ? '<p style="color: #6b7280; font-size: 14px; margin-top: 15px;">Die Werkstatt bietet Ihnen mehrere Optionen zur Auswahl an.</p>' : ''}
            
            <p style="color: #9ca3af; font-size: 13px; margin-top: 15px; padding: 10px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
              ℹ️ <strong>Hinweis bei Mischbereifung:</strong> Der Gesamtpreis kann sich ändern, wenn Sie weitere Reifen (z.B. auch Hinterreifen) auswählen. Konfigurieren Sie Ihr komplettes Angebot auf Bereifung24.de
            </p>
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
Dimension: ${data.tireSpecs}

${data.tireOptions.map(option => {
  // Berechne Anzahl basierend auf carTireType/motorcycleTireType
  let tireCount = data.quantity
  if (option.carTireType === 'FRONT_TWO' || option.carTireType === 'REAR_TWO') {
    tireCount = 2
  } else if (option.carTireType === 'ALL_FOUR') {
    tireCount = 4
  } else if (option.motorcycleTireType === 'FRONT' || option.motorcycleTireType === 'REAR') {
    tireCount = 1
  } else if (option.motorcycleTireType === 'BOTH') {
    tireCount = 2
  }
  
  // Berechne anteilige Montagekosten: (Montage / Gesamt-Reifen) * Diese-Reifen
  const installationPerOption = (data.installationFee / data.quantity) * tireCount
  const tiresTotal = option.pricePerTire * tireCount
  const optionPrice = tiresTotal + installationPerOption
  
  const tireTypeLabel = option.motorcycleTireType 
    ? formatTireType(option.motorcycleTireType, true)
    : option.carTireType 
      ? formatTireType(option.carTireType, false)
      : ''
  return `Reifen: ${option.brand} ${option.model}${tireTypeLabel ? '\n' + tireTypeLabel : ''}\nPreis: ${optionPrice.toFixed(2)} € (${tireCount} Reifen á ${option.pricePerTire.toFixed(2)} € + Montage ${installationPerOption.toFixed(2)} €)`
}).join('\n\n')}

${data.tireOptions.length > 1 ? '\nDie Werkstatt bietet Ihnen mehrere Optionen zur Auswahl an.' : ''}

HINWEIS: Bei Mischbereifung kann sich der Gesamtpreis ändern, wenn Sie weitere Reifen auswählen. Konfigurieren Sie Ihr komplettes Angebot auf Bereifung24.de

Sehen Sie sich das Angebot an: ${process.env.NEXTAUTH_URL}/dashboard/customer/requests/${data.requestId}

Beste Grüße,
Ihr Bereifung24-Team
  `

  return { subject, html, text }
}

export function newServiceOfferEmailTemplate(data: {
  customerName: string
  workshopName: string
  serviceType: string
  serviceDescription: string
  price: number
  durationMinutes: number
  requestId: string
}) {
  const subject = `Neues Angebot für Ihre ${data.serviceType}-Anfrage`
  
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
          
          <p>Sie haben ein neues Angebot für Ihre ${data.serviceType}-Anfrage erhalten!</p>
          
          <div class="offer-box">
            <h2 style="margin-top: 0; color: #1e40af;">Angebot von ${data.workshopName}</h2>
            
            <p><strong>Service:</strong> ${data.serviceType}</p>
            ${data.serviceDescription ? `<p style="color: #6b7280;">${data.serviceDescription}</p>` : ''}
            
            <div style="background: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #e5e7eb;">
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 600; color: #1e40af;">
                ${data.price.toFixed(2)} € 
                <span style="font-size: 14px; color: #6b7280; font-weight: normal;">inkl. Montage</span>
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #9ca3af;">
                ⏱️ Dauer: ca. ${data.durationMinutes} Minuten
              </p>
            </div>
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
Service: ${data.serviceType}
${data.serviceDescription ? `\n${data.serviceDescription}\n` : ''}
Preis: ${data.price.toFixed(2)} € (inkl. Montage)
Dauer: ca. ${data.durationMinutes} Minuten

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
  customerStreet?: string
  customerZipCode?: string
  customerCity?: string
  vehicleInfo?: string
  serviceType?: 'TIRE' | 'BRAKE' | 'BATTERY' | 'OTHER'
  serviceDetails?: string
  additionalNotes?: string
}) {
  const subject = `Ihr Angebot wurde angenommen - ${data.customerName}`
  
  const isTireService = !data.serviceType || data.serviceType === 'TIRE'
  const showTireSpecs = isTireService && data.tireSpecs && !data.tireSpecs.startsWith('0/')
  
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
            
            ${showTireSpecs ? `
              <p><strong>Reifen:</strong> ${data.tireBrand} ${data.tireModel}</p>
              <p><strong>Dimension:</strong> ${data.tireSpecs}</p>
            ` : ''}
            
            ${data.serviceType && data.serviceType !== 'TIRE' ? `
              <p><strong>Service:</strong> ${data.serviceType === 'BRAKE' ? 'Bremsen-Service' : data.serviceType === 'BATTERY' ? 'Batterie-Service' : 'Sonstige Reifenservices'}</p>
              ${data.serviceDetails ? `<p><strong>Details:</strong> ${data.serviceDetails}</p>` : ''}
            ` : ''}
            
            ${data.vehicleInfo ? `<p><strong>Fahrzeug:</strong> ${data.vehicleInfo}</p>` : ''}
            
            <div class="highlight">${data.price.toFixed(2)} €</div>
            <p style="color: #6b7280; font-size: 14px;">${showTireSpecs ? 'inkl. Montage' : 'Gesamtpreis'}</p>
            
            ${data.additionalNotes ? `<p style="margin-top: 15px; padding: 10px; background: #f3f4f6; border-radius: 4px;"><strong>Zusätzliche Hinweise:</strong><br>${data.additionalNotes.replace(/\n/g, '<br>')}</p>` : ''}
          </div>
          
          <div class="customer-info">
            <h3 style="margin-top: 0; color: #059669;">Kundenkontakt & Adresse</h3>
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>E-Mail:</strong> <a href="mailto:${data.customerEmail}">${data.customerEmail}</a></p>
            ${data.customerPhone ? `<p><strong>Telefon:</strong> ${data.customerPhone}</p>` : ''}
            ${data.customerStreet || data.customerZipCode || data.customerCity ? `
              <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d1d5db;">
                <strong>Adresse:</strong><br>
                ${data.customerStreet || ''}<br>
                ${data.customerZipCode || ''} ${data.customerCity || ''}
              </p>
            ` : ''}
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

${showTireSpecs ? `Reifen: ${data.tireBrand} ${data.tireModel}\nDimension: ${data.tireSpecs}\n` : ''}
${data.serviceType && data.serviceType !== 'TIRE' ? `Service: ${data.serviceType === 'BRAKE' ? 'Bremsen-Service' : data.serviceType === 'BATTERY' ? 'Batterie-Service' : 'Sonstige Reifenservices'}\n` : ''}
${data.serviceDetails ? `Details: ${data.serviceDetails}\n` : ''}
${data.vehicleInfo ? `Fahrzeug: ${data.vehicleInfo}\n` : ''}
Preis: ${data.price.toFixed(2)} €
${data.additionalNotes ? `\nZusätzliche Hinweise:\n${data.additionalNotes}\n` : ''}

Kundenkontakt & Adresse:
Name: ${data.customerName}
E-Mail: ${data.customerEmail}
${data.customerPhone ? `Telefon: ${data.customerPhone}\n` : ''}
${data.customerStreet ? `Straße: ${data.customerStreet}\n` : ''}
${data.customerZipCode || data.customerCity ? `Ort: ${data.customerZipCode || ''} ${data.customerCity || ''}\n` : ''}

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
  vehicleInfo?: string
  isRunflat?: boolean
  hasTireDisposal?: boolean
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
            <strong>📍 Entfernung: </strong>Ca. ${data.distance} von Ihrem Standort<br>
            <strong>📅 Benötigt bis: </strong>${data.needByDate}
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
            
            ${data.isRunflat ? `
            <div class="detail-row">
              <span class="detail-label">Reifentyp: </span>
              <span class="detail-value">RunFlat-Reifen</span>
            </div>
            ` : ''}
            
            ${data.hasTireDisposal ? `
            <div class="detail-row">
              <span class="detail-label">Altreifenentsorgung: </span>
              <span class="detail-value">Ja</span>
            </div>
            ` : ''}
            
            ${data.preferredBrands ? `
            <div class="detail-row">
              <span class="detail-label">Bevorzugte Marken: </span>
              <span class="detail-value">${data.preferredBrands}</span>
            </div>
            ` : ''}
            
            ${data.additionalNotes ? `
            <div class="detail-row">
              <span class="detail-label">Zusätzliche Hinweise: </span>
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
  appointmentStart?: Date
  appointmentEnd?: Date
  serviceType?: string
  pricePerTire?: number
  quantity?: number
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
          ${data.tireBrand && data.tireModel ? `
          <div class="detail-row">
            <span class="detail-label">Reifen:</span>
            <span class="detail-value"><strong>${data.tireBrand} ${data.tireModel}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Größe:</span>
            <span class="detail-value">${data.tireSize}</span>
          </div>
          ${data.pricePerTire ? `
          <div class="detail-row">
            <span class="detail-label">Preis pro Reifen:</span>
            <span class="detail-value">${data.pricePerTire.toFixed(2)} €</span>
          </div>
          ` : ''}
          ` : `
          <p style="color: #6b7280; font-style: italic;">Reifeninformationen werden von der Werkstatt ergänzt</p>
          `}

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

          <p style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            💡 <strong>Tipp:</strong> Diese E-Mail enthält eine ICS-Kalenderdatei im Anhang. 
            Öffnen Sie den Anhang, um den Termin automatisch in Ihren Kalender (Outlook, Google Kalender, Apple Kalender) einzutragen.
          </p>

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
  appointmentStart?: Date
  appointmentEnd?: Date
  serviceType?: string
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
          ${data.tireBrand && data.tireModel ? `
          <div class="detail-row">
            <span class="detail-label">Reifen:</span>
            <span class="detail-value"><strong>${data.tireBrand} ${data.tireModel}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Größe:</span>
            <span class="detail-value">${data.tireSize}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Menge:</span>
            <span class="detail-value">${data.quantity} Reifen</span>
          </div>
          ` : `
          <p style="color: #6b7280; font-style: italic; margin: 15px 0;">Keine Reifen gebucht - nur Service</p>
          `}
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

          ${data.tireBrand && data.tireModel && data.tireSize ? `
          <div style="margin: 25px 0; padding: 20px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; text-align: center;">
            <h3 style="margin-top: 0; color: #059669;">🛒 Reifen bestellen</h3>
            <p style="margin: 10px 0;">Bestellen Sie die Reifen direkt bei Tyresystem:</p>
            <a href="https://www.tyresystem.de/s?suche=${encodeURIComponent(data.tireBrand + ' ' + data.tireModel + ' ' + data.tireSize)}" target="_blank" style="display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; font-size: 16px;">
              🔍 Reifen bei Tyresystem suchen
            </a>
            <p style="margin: 10px 0; font-size: 13px; color: #6b7280;">
              ${data.tireBrand} ${data.tireModel} • ${data.tireSize} • ${data.quantity} Stück
            </p>
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
            - ✅ <strong>Termin wurde bereits in Ihrem Google Kalender eingetragen</strong><br>
            - Bei Bedarf Kunde kontaktieren
          </p>

          <p style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
            <strong>📅 Google Kalender:</strong> Der Termin wurde automatisch in Ihren verbundenen Google Kalender eingetragen. 
            Sie finden dort alle Details zum Auftrag inklusive Kundeninformationen und Fahrzeugdaten.
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

/**
 * Enhanced booking confirmation for CUSTOMER after payment
 * Includes detailed service info, pricing breakdown, and ICS attachment
 */
export function directBookingConfirmationCustomerEmail(data: {
  customerName: string
  workshopName: string
  workshopAddress: string
  workshopPhone: string
  workshopEmail?: string
  workshopLogoUrl?: string
  serviceType: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  durationMinutes: number
  bookingId: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleYear?: number
  vehicleLicensePlate?: string
  tireEAN?: string
  // Tire details (if applicable)
  tireBrand?: string
  tireModel?: string
  tireSize?: string
  tireQuantity?: number
  tirePurchasePrice?: number
  totalTirePurchasePrice?: number
  tireRunFlat?: boolean
  tire3PMSF?: boolean
  tireData?: any // Mixed tires data JSON
  // Pricing
  basePrice: number
  balancingPrice?: number
  storagePrice?: number
  disposalFee?: number
  runFlatSurcharge?: number
  totalPrice: number
  paymentMethod: string
  // Options
  hasBalancing?: boolean
  hasStorage?: boolean
  hasDisposal?: boolean
  customerNotes?: string
}) {
  const serviceLabels: Record<string, string> = {
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_CHANGE': 'Reifenwechsel',
    'TIRE_MOUNT': 'Reifenmontage'
  }

  const serviceLabel = serviceLabels[data.serviceType] || data.serviceName

  return {
    subject: `✅ Buchung bestätigt - ${serviceLabel} am ${data.appointmentDate}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { max-height: 60px; max-width: 180px; margin-bottom: 15px; }
        .content { background: white; padding: 30px; }
        .success-badge { background: #10b981; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .section { margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
        .section-header { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 15px; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .price-total { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .info-box { padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 15px 0; }
        .warning-box { padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 15px 0; }
        .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${data.workshopLogoUrl ? `<img src="${data.workshopLogoUrl}" alt="${data.workshopName}" class="logo">` : ''}
          <h1 style="margin: 10px 0;">✅ Buchung bestätigt!</h1>
          <div class="success-badge">BEZAHLT</div>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;"><strong>Hallo ${data.customerName},</strong></p>
          
          <p>vielen Dank für Ihre Buchung! Ihre Zahlung über <strong>${data.totalPrice.toFixed(2)}€</strong> wurde erfolgreich verarbeitet.</p>

          <!-- Appointment Details -->
          <div class="section">
            <div class="section-header">📅 Ihr Termin</div>
            <div class="detail-row">
              <span class="detail-label">Datum:</span>
              <span class="detail-value">${data.appointmentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Uhrzeit:</span>
              <span class="detail-value">${data.appointmentTime} Uhr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dauer:</span>
              <span class="detail-value">ca. ${data.durationMinutes} Minuten</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Buchungsnummer:</span>
              <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <!-- Workshop Details -->
          <div class="section">
            <div class="section-header">🏢 Werkstatt</div>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0; color: #059669;">${data.workshopName}</p>
            <p style="margin: 5px 0;">📍 ${data.workshopAddress}</p>
            <p style="margin: 5px 0;">📞 ${data.workshopPhone}</p>
            ${data.workshopEmail ? `<p style="margin: 5px 0;">✉️ ${data.workshopEmail}</p>` : ''}
          </div>

          <!-- Service Details -->
          <div class="section">
            <div class="section-header">🔧 Gebuchter Service</div>
            <p style="font-size: 16px; font-weight: bold; color: #059669;">${serviceLabel}</p>
            
            ${data.vehicleBrand || data.vehicleModel ? `
            <div style="margin-top: 15px;">
              <strong>Ihr Fahrzeug:</strong><br>
              ${data.vehicleBrand || ''} ${data.vehicleModel || ''}
              ${data.vehicleLicensePlate ? `<br>Kennzeichen: ${data.vehicleLicensePlate}` : ''}
            </div>
            ` : ''}

            ${data.tireData?.isMixedTires ? `
            <div style="margin-top: 15px;">
              <strong>🛞 Ausgewählte Reifen (Mischbereifung):</strong><br><br>
              <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                <strong>Vorderachse:</strong><br>
                ${data.tireData.front.brand} ${data.tireData.front.model}<br>
                Größe: ${data.tireData.front.size}<br>
                Menge: ${data.tireData.front.quantity} Stück<br>
                ${data.tireData.front.purchasePrice ? `Preis pro Reifen: ${data.tireData.front.purchasePrice.toFixed(2)}€<br>` : ''}
                ${data.tireData.front.totalPrice ? `<strong>Gesamt: ${data.tireData.front.totalPrice.toFixed(2)}€</strong>` : ''}
                ${data.tireData.front.runFlat ? '<br>⚡ <span style="color: #dc2626;">RunFlat-Reifen</span>' : ''}
                ${data.tireData.front.threePMSF ? '<br>❄️ <span style="color: #2563eb;">Winterreifen (3PMSF)</span>' : ''}
              </div>
              <div style="background: #f3f4f6; padding: 12px; border-radius: 6px;">
                <strong>Hinterachse:</strong><br>
                ${data.tireData.rear.brand} ${data.tireData.rear.model}<br>
                Größe: ${data.tireData.rear.size}<br>
                Menge: ${data.tireData.rear.quantity} Stück<br>
                ${data.tireData.rear.purchasePrice ? `Preis pro Reifen: ${data.tireData.rear.purchasePrice.toFixed(2)}€<br>` : ''}
                ${data.tireData.rear.totalPrice ? `<strong>Gesamt: ${data.tireData.rear.totalPrice.toFixed(2)}€</strong>` : ''}
                ${data.tireData.rear.runFlat ? '<br>⚡ <span style="color: #dc2626;">RunFlat-Reifen</span>' : ''}
                ${data.tireData.rear.threePMSF ? '<br>❄️ <span style="color: #2563eb;">Winterreifen (3PMSF)</span>' : ''}
              </div>
            </div>
            ` : data.tireBrand && data.tireModel ? `
            <div style="margin-top: 15px;">
              <strong>🛞 Ausgewählte Reifen:</strong><br>
              ${data.tireBrand} ${data.tireModel}<br>
              Größe: ${data.tireSize || 'nicht angegeben'}<br>
              Menge: ${data.tireQuantity || 4} Stück
              ${data.tireRunFlat ? '<br>⚡ <span style="color: #dc2626;">RunFlat-Reifen</span>' : ''}
              ${data.tire3PMSF ? '<br>❄️ <span style="color: #2563eb;">Winterreifen (3PMSF)</span>' : ''}
            </div>
            ` : ''}

            ${data.hasBalancing || data.hasStorage || data.hasDisposal ? `
            <div style="margin-top: 15px;">
              <strong>Zusatzleistungen:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                ${data.hasBalancing ? `<li>✅ Auswuchtung (+${data.balancingPrice?.toFixed(2) || '0.00'}€)</li>` : ''}
                ${data.hasStorage ? `<li>✅ Einlagerung (+${data.storagePrice?.toFixed(2) || '0.00'}€)</li>` : ''}
                ${data.hasDisposal ? `<li>✅ Reifenentsorgung (+${data.disposalFee?.toFixed(2) || '0.00'}€)</li>` : ''}
                ${data.runFlatSurcharge && data.runFlatSurcharge > 0 ? `<li>✅ RunFlat-Aufschlag (+${data.runFlatSurcharge.toFixed(2)}€)</li>` : ''}
              </ul>
            </div>
            ` : ''}
          </div>

          <!-- Pricing -->
          <div class="section">
            <div class="section-header">💰 Preis-Übersicht</div>
            <div class="detail-row">
              <span class="detail-label">Basis-Service:</span>
              <span class="detail-value">${data.basePrice.toFixed(2)}€</span>
            </div>
            ${data.totalTirePurchasePrice && data.totalTirePurchasePrice > 0 ? `
            <div class="detail-row">
              <span class="detail-label">${data.tireData?.isMixedTires ? 'Reifen (Mischbereifung)' : `Reifen (${data.tireQuantity || 4}x ${data.tireBrand || ''} ${data.tireModel || ''})`}:</span>
              <span class="detail-value">+${data.totalTirePurchasePrice?.toFixed(2) || '0.00'}€</span>
            </div>
            ` : ''}
            ${data.balancingPrice && data.balancingPrice > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Auswuchtung:</span>
              <span class="detail-value">+${data.balancingPrice.toFixed(2)}€</span>
            </div>
            ` : ''}
            ${data.storagePrice && data.storagePrice > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Einlagerung:</span>
              <span class="detail-value">+${data.storagePrice.toFixed(2)}€</span>
            </div>
            ` : ''}
            ${data.disposalFee && data.disposalFee > 0 ? `
            <div class="detail-row">
              <span class="detail-label">Entsorgung:</span>
              <span class="detail-value">+${data.disposalFee.toFixed(2)}€</span>
            </div>
            ` : ''}
            ${data.runFlatSurcharge && data.runFlatSurcharge > 0 ? `
            <div class="detail-row">
              <span class="detail-label">RunFlat-Aufschlag:</span>
              <span class="detail-value">+${data.runFlatSurcharge.toFixed(2)}€</span>
            </div>
            ` : ''}
          </div>

          <div class="price-total">
            <div style="font-size: 14px; opacity: 0.9;">Gesamtsumme</div>
            <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">${data.totalPrice.toFixed(2)}€</div>
            <div style="font-size: 14px; opacity: 0.9;">✅ BEZAHLT per ${data.paymentMethod}</div>
          </div>

          ${data.customerNotes ? `
          <div class="info-box">
            <strong>💬 Ihre Nachricht an die Werkstatt:</strong><br>
            "${data.customerNotes}"
          </div>
          ` : ''}

          <div class="info-box">
            <strong>📅 Termin in Kalender importieren</strong><br>
            Diese Email enthält eine ICS-Kalenderdatei im Anhang. Öffnen Sie den Anhang, 
            um den Termin automatisch in Ihren Kalender (Google, Outlook, Apple) einzutragen.
          </div>

          <div class="warning-box">
            <strong>⏰ Wichtige Hinweise:</strong><br>
            • Bitte erscheinen Sie pünktlich zum Termin<br>
            • Bei Verspätung über 15 Min. bitte Werkstatt anrufen<br>
            • Bei Verhinderung bitte rechtzeitig absagen
          </div>

          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/customer/bookings" class="button">
              Meine Buchungen ansehen
            </a>
          </center>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Bei Fragen zu Ihrem Termin wenden Sie sich bitte direkt an die Werkstatt.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Bereifung24</strong> - Ihre Plattform für Reifenservice</p>
          <p>Diese Buchung wurde über bereifung24.de abgewickelt</p>
        </div>
      </div>
    </body>
    </html>
    `
  }
}

/**
 * Enhanced booking notification for WORKSHOP after payment
 * Includes customer invoice data, tire ordering info, and commission breakdown
 */
export function directBookingNotificationWorkshopEmail(data: {
  workshopName: string
  bookingId: string
  serviceName: string
  serviceType: string
  appointmentDate: string
  appointmentTime: string
  durationMinutes: number
  // Customer data (for invoice)
  customerName: string
  customerEmail: string
  customerPhone: string
  customerInvoiceAddress?: string
  customerNotes?: string
  // Vehicle
  vehicleBrand?: string
  vehicleModel?: string
  vehicleLicensePlate?: string
  // Tire details (if applicable)
  tireBrand?: string
  tireModel?: string
  tireSize?: string
  tireQuantity?: number
  tireEAN?: string
  tireArticleId?: string
  tireRunFlat?: boolean
  tire3PMSF?: boolean
  tireData?: any // Mixed tires data JSON
  // Supplier info (if applicable)
  supplierName?: string
  supplierConnectionType?: 'API' | 'CSV'
  supplierPhone?: string
  supplierEmail?: string
  supplierWebsite?: string
  supplierOrderId?: string
  estimatedDeliveryDate?: string
  // Pricing
  tirePurchasePrice?: number
  totalPurchasePrice?: number
  basePrice: number
  balancingPrice?: number
  storagePrice?: number
  disposalFee?: number
  runFlatSurcharge?: number
  totalPrice: number
  platformCommission: number
  workshopPayout: number
  workshopProfit?: number
  // Options
  hasBalancing?: boolean
  hasStorage?: boolean
  hasDisposal?: boolean
}) {
  const isTireService = data.serviceType === 'TIRE_CHANGE' || data.serviceType === 'TIRE_MOUNT'
  const isAPISupplier = data.supplierConnectionType === 'API'
  const isCSVSupplier = data.supplierConnectionType === 'CSV'

  return {
    subject: `🔔 Neue BEZAHLTE Buchung: ${data.serviceName} am ${data.appointmentDate}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; background: #f9fafb; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; }
        .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 0 5px; }
        .badge-success { background: #10b981; color: white; }
        .badge-warning { background: #fbbf24; color: #78350f; }
        .section { margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${isTireService ? '#10b981' : '#3b82f6'}; }
        .section-header { font-size: 18px; font-weight: bold; color: #059669; margin-bottom: 15px; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6b7280; flex: 1; }
        .detail-value { color: #111827; font-weight: 500; flex: 1; text-align: right; }
        .order-box { background: ${isAPISupplier ? '#d1fae5' : '#fef3c7'}; border: 2px solid ${isAPISupplier ? '#10b981' : '#f59e0b'}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .price-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .price-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .price-table tr:last-child td { border-bottom: 2px solid #059669; font-weight: bold; font-size: 18px; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 10px 0;">🔔 Neue Buchung!</h1>
          <div>
            <span class="badge badge-success">✅ BEZAHLT</span>
            ${isTireService && isAPISupplier ? '<span class="badge badge-success">🛞 REIFEN BESTELLT</span>' : ''}
            ${isTireService && isCSVSupplier ? '<span class="badge badge-warning">⚠️ REIFEN MANUELL BESTELLEN</span>' : ''}
          </div>
        </div>
        
        <div class="content">
          <p style="font-size: 16px;"><strong>Hallo ${data.workshopName},</strong></p>
          
          <p>Sie haben eine neue, bestätigte Buchung erhalten. Die Zahlung wurde bereits vom Kunden geleistet.</p>

          <!-- Appointment Details -->
          <div class="section">
            <div class="section-header">📅 Termin-Details</div>
            <div class="detail-row">
              <span class="detail-label">Datum:</span>
              <span class="detail-value">${data.appointmentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Uhrzeit:</span>
              <span class="detail-value">${data.appointmentTime} Uhr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dauer:</span>
              <span class="detail-value">ca. ${data.durationMinutes} Min.</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value"><strong>${data.serviceName}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Buchungsnr.:</span>
              <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="section">
            <div class="section-header">👤 Kunden-Informationen (für Rechnung)</div>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;"><strong>Name:</strong></td>
                <td style="padding: 5px 0;">${data.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Email:</strong></td>
                <td style="padding: 5px 0;">${data.customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Telefon:</strong></td>
                <td style="padding: 5px 0;">${data.customerPhone}</td>
              </tr>
              ${data.customerInvoiceAddress ? `
              <tr>
                <td style="padding: 5px 0;"><strong>Adresse:</strong></td>
                <td style="padding: 5px 0;">${data.customerInvoiceAddress}</td>
              </tr>
              ` : ''}
            </table>
            <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
              <em>ℹ️ Diese Daten können Sie für die Rechnungsstellung verwenden.</em>
            </p>
          </div>

          <!-- Vehicle & Service -->
          <div class="section">
            <div class="section-header">🚗 Fahrzeug & Service</div>
            ${data.vehicleBrand || data.vehicleModel ? `
            <div class="detail-row">
              <span class="detail-label">Fahrzeug:</span>
              <span class="detail-value">${data.vehicleBrand || ''} ${data.vehicleModel || ''}</span>
            </div>
            ` : ''}
            ${data.vehicleLicensePlate ? `
            <div class="detail-row">
              <span class="detail-label">Kennzeichen:</span>
              <span class="detail-value">${data.vehicleLicensePlate}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value"><strong>${data.serviceName}</strong></span>
            </div>
            ${data.hasBalancing ? '<div class="detail-row"><span class="detail-label">Auswuchtung:</span><span class="detail-value">✅ Ja</span></div>' : ''}
            ${data.hasStorage ? '<div class="detail-row"><span class="detail-label">Einlagerung:</span><span class="detail-value">✅ Ja</span></div>' : ''}
            ${data.hasDisposal ? `<div class="detail-row"><span class="detail-label">Reifenentsorgung:</span><span class="detail-value">✅ Ja (+${data.disposalFee?.toFixed(2) || '0.00'}€)</span></div>` : ''}
            ${data.runFlatSurcharge && data.runFlatSurcharge > 0 ? `<div class="detail-row"><span class="detail-label">RunFlat-Aufschlag:</span><span class="detail-value">+${data.runFlatSurcharge.toFixed(2)}€</span></div>` : ''}
          </div>

          ${data.tireData?.isMixedTires ? `
          <!-- Mixed Tires Information -->
          <div class="section">
            <div class="section-header">🛞 Reifeninformationen (Mischbereifung)</div>
            
            <h4 style="margin: 15px 0 10px 0; color: #059669;">Vorderachse</h4>
            <table style="width: 100%; margin: 10px 0;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Marke & Modell:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${data.tireData.front.brand} ${data.tireData.front.model}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Größe:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.tireData.front.size}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Menge:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${data.tireData.front.quantity} Stück</strong></td>
              </tr>
              ${data.tireData.front.ean ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">EAN:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${data.tireData.front.ean}</code></td>
              </tr>
              ` : ''}
              ${data.tireData.front.articleId ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Artikel-Nr.:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; color: #1e40af;">${data.tireData.front.articleId}</code></td>
              </tr>
              ` : ''}
              ${data.tireData.front.purchasePrice ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">VK-Preis pro Reifen:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.tireData.front.purchasePrice.toFixed(2)}€</td>
              </tr>
              ` : ''}
              ${data.tireData.front.totalPrice ? `
              <tr style="background: #fef3c7;">
                <td style="padding: 12px 0; font-weight: bold;">Gesamt-VK Vorne:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">${data.tireData.front.totalPrice.toFixed(2)}€</td>
              </tr>
              ` : ''}
            </table>
            ${data.tireData.front.articleId ? `
            <div style="text-align: center; margin: 10px 0;">
              <a href="https://www.tyresystem.de/s?suche=id${data.tireData.front.articleId}" target="_blank" style="display: inline-block; background: #10b981; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🛒 Vorne bei Tyresystem bestellen
              </a>
            </div>
            ` : ''}

            <h4 style="margin: 25px 0 10px 0; color: #059669;">Hinterachse</h4>
            <table style="width: 100%; margin: 10px 0;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Marke & Modell:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${data.tireData.rear.brand} ${data.tireData.rear.model}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Größe:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.tireData.rear.size}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Menge:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${data.tireData.rear.quantity} Stück</strong></td>
              </tr>
              ${data.tireData.rear.ean ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">EAN:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${data.tireData.rear.ean}</code></td>
              </tr>
              ` : ''}
              ${data.tireData.rear.articleId ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Artikel-Nr.:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; color: #1e40af;">${data.tireData.rear.articleId}</code></td>
              </tr>
              ` : ''}
              ${data.tireData.rear.purchasePrice ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">VK-Preis pro Reifen:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.tireData.rear.purchasePrice.toFixed(2)}€</td>
              </tr>
              ` : ''}
              ${data.tireData.rear.totalPrice ? `
              <tr style="background: #fef3c7;">
                <td style="padding: 12px 0; font-weight: bold;">Gesamt-VK Hinten:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">${data.tireData.rear.totalPrice.toFixed(2)}€</td>
              </tr>
              ` : ''}
            </table>
            ${data.tireData.rear.articleId ? `
            <div style="text-align: center; margin: 10px 0;">
              <a href="https://www.tyresystem.de/s?suche=id${data.tireData.rear.articleId}" target="_blank" style="display: inline-block; background: #10b981; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🛒 Hinten bei Tyresystem bestellen
              </a>
            </div>
            ` : ''}
          </div>
          ` : data.tireBrand && data.tireModel ? `
          <!-- Tire Information (always show if tires are included) -->
          <div class="section">
            <div class="section-header">🛞 Reifeninformationen</div>
            <table style="width: 100%; margin: 10px 0;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Marke & Modell:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${data.tireBrand} ${data.tireModel}</strong></td>
              </tr>
              ${data.tireSize ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Größe:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.tireSize}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Menge:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>${data.tireQuantity || 4} Stück</strong></td>
              </tr>
              ${data.tireEAN ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">EAN:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${data.tireEAN}</code></td>
              </tr>
              ` : ''}
              ${data.tireArticleId ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Artikel-Nr.:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;"><code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; color: #1e40af;">${data.tireArticleId}</code></td>
              </tr>
              ` : ''}
              ${data.tirePurchasePrice ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">VK-Preis pro Reifen:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${data.tirePurchasePrice.toFixed(2)}€</td>
              </tr>
              ` : ''}
              ${data.totalPurchasePrice ? `
              <tr style="background: #fef3c7;">
                <td style="padding: 12px 0; font-weight: bold;">Gesamt-VK:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px;">${data.totalPurchasePrice.toFixed(2)}€</td>
              </tr>
              ` : ''}
              ${data.tireRunFlat || data.tire3PMSF ? `
              <tr>
                <td colspan="2" style="padding: 8px 0;">
                  ${data.tireRunFlat ? '<span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">⚡ RunFlat</span>' : ''}
                  ${data.tire3PMSF ? '<span style="background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">❄️ Winter (3PMSF)</span>' : ''}
                </td>
              </tr>
              ` : ''}
            </table>
            ${data.tireArticleId ? `
            <div style="text-align: center; margin: 15px 0;">
              <a href="https://www.tyresystem.de/s?suche=id${data.tireArticleId}" target="_blank" style="display: inline-block; background: #10b981; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🛒 Bei Tyresystem bestellen
              </a>
            </div>
            ` : ''}
          </div>
          ` : ''}
          ${isTireService && isAPISupplier ? `
          <!-- API Supplier: Tires Automatically Ordered -->
          <div class="order-box">
            <h3 style="margin-top: 0; color: #059669;">✅ Reifen automatisch bestellt</h3>
            <p style="margin: 10px 0;">Die Reifen wurden automatisch über <strong>${data.supplierName}</strong> bestellt:</p>
            
            <table style="width: 100%; margin: 15px 0; background: white; border-radius: 8px; overflow: hidden;">
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left;">Artikel</th>
                <th style="padding: 12px; text-align: center;">Menge</th>
                <th style="padding: 12px; text-align: center;">EAN</th>
                <th style="padding: 12px; text-align: center;">Artikel-Nr.</th>
                <th style="padding: 12px; text-align: right;">EK-Preis</th>
              </tr>
              <tr>
                <td style="padding: 12px;">
                  <strong>${data.tireBrand} ${data.tireModel}</strong><br>
                  <small style="color: #6b7280;">${data.tireSize || ''}</small>
                  ${data.tireRunFlat ? '<br><span style="color: #dc2626; font-size: 12px;">⚡ RunFlat</span>' : ''}
                  ${data.tire3PMSF ? '<br><span style="color: #2563eb; font-size: 12px;">❄️ Winter</span>' : ''}
                </td>
                <td style="padding: 12px; text-align: center;"><strong>${data.tireQuantity || 4} Stk.</strong></td>
                <td style="padding: 12px; text-align: center;"><code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${data.tireEAN || 'N/A'}</code></td>
                <td style="padding: 12px; text-align: center;"><code style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #1e40af;">${data.tireArticleId || 'N/A'}</code></td>
                <td style="padding: 12px; text-align: right;"><strong>${data.tirePurchasePrice?.toFixed(2) || '0.00'}€</strong></td>
              </tr>
              <tr style="background: #f3f4f6; font-weight: bold;">
                <td colspan="4" style="padding: 12px; text-align: right;">Gesamt-EK:</td>
                <td style="padding: 12px; text-align: right;">${data.totalPurchasePrice?.toFixed(2) || '0.00'}€</td>
              </tr>
            </table>

            ${data.tireArticleId ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://www.tyresystem.de/s?suche=id${data.tireArticleId}" target="_blank" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🛒 Direkt bei Tyresystem bestellen
              </a>
            </div>
            ` : ''}

            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <strong>📦 Lieferung:</strong><br>
              ${data.supplierOrderId ? `Bestellnummer: <strong>${data.supplierOrderId}</strong><br>` : ''}
              ${data.estimatedDeliveryDate ? `Voraussichtlich: <strong>${data.estimatedDeliveryDate}</strong>` : 'Liefertermin wird vom Lieferanten bestätigt'}
            </div>
          </div>
          ` : ''}

          ${isTireService && isCSVSupplier ? `
          <!-- CSV Supplier: Manual Tire Order Required -->
          <div class="order-box">
            <h3 style="margin-top: 0; color: #d97706;">⚠️ BITTE REIFEN BESTELLEN</h3>
            <p style="margin: 10px 0; font-weight: bold;">Sie müssen folgende Reifen SELBST beim Lieferanten bestellen:</p>
            
            <table style="width: 100%; margin: 15px 0; background: white; border-radius: 8px; overflow: hidden;">
              <tr style="background: #fef3c7;">
                <th style="padding: 12px; text-align: left;">Artikel</th>
                <th style="padding: 12px; text-align: center;">Menge</th>
                <th style="padding: 12px; text-align: center;">EAN</th>
                <th style="padding: 12px; text-align: center;">Artikel-Nr.</th>
                <th style="padding: 12px; text-align: right;">EK-Preis</th>
              </tr>
              <tr>
                <td style="padding: 12px;">
                  <strong style="font-size: 16px;">${data.tireBrand} ${data.tireModel}</strong><br>
                  <span style="color: #6b7280;">Größe: ${data.tireSize || 'nicht angegeben'}</span>
                  ${data.tireRunFlat ? '<br><span style="color: #dc2626;">⚡ RunFlat-Reifen</span>' : ''}
                  ${data.tire3PMSF ? '<br><span style="color: #2563eb;">❄️ Winterreifen (3PMSF)</span>' : ''}
                </td>
                <td style="padding: 12px; text-align: center;">
                  <strong style="font-size: 20px; color: #d97706;">${data.tireQuantity || 4} Stück</strong>
                </td>
                <td style="padding: 12px; text-align: center;">
                  <code style="background: #fef3c7; padding: 8px 12px; border-radius: 4px; font-size: 14px; font-weight: bold;">${data.tireEAN || 'N/A'}</code>
                </td>
                <td style="padding: 12px; text-align: center;">
                  <code style="background: #dbeafe; padding: 8px 12px; border-radius: 4px; font-size: 14px; font-weight: bold; color: #1e40af;">${data.tireArticleId || 'N/A'}</code>
                </td>
                <td style="padding: 12px; text-align: right;">
                  <strong style="font-size: 16px;">${data.tirePurchasePrice?.toFixed(2) || '0.00'}€</strong>
                </td>
              </tr>
              <tr style="background: #fef3c7; font-weight: bold; font-size: 16px;">
                <td colspan="4" style="padding: 12px; text-align: right;">Gesamt-EK:</td>
                <td style="padding: 12px; text-align: right; color: #d97706;">${data.totalPurchasePrice?.toFixed(2) || '0.00'}€</td>
              </tr>
            </table>

            ${data.tireArticleId ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://www.tyresystem.de/s?suche=id${data.tireArticleId}" target="_blank" style="display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🛒 Jetzt bei Tyresystem bestellen »
              </a>
              <p style="margin-top: 10px; font-size: 13px; color: #6b7280;">Klicken Sie hier für direkten Zugriff auf den Reifen</p>
            </div>
            ` : ''}

            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <strong style="font-size: 16px;">📞 Ihr Lieferant:</strong><br>
              <strong style="font-size: 18px; color: #059669;">${data.supplierName || 'Kein Lieferant konfiguriert'}</strong><br>
              ${data.supplierPhone ? `Telefon: ${data.supplierPhone}<br>` : ''}
              ${data.supplierEmail ? `Email: ${data.supplierEmail}<br>` : ''}
              ${data.supplierWebsite ? `Website: <a href="${data.supplierWebsite}" style="color: #10b981;">${data.supplierWebsite}</a>` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Financial Overview -->
          <div class="section">
            <div class="section-header">💰 Finanzielle Übersicht</div>
            <table class="price-table">
              <tr>
                <td>Kunde bezahlt:</td>
                <td style="text-align: right; font-weight: bold;">${data.totalPrice.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="color: #dc2626;">Platform-Provision (6,9%):</td>
                <td style="text-align: right; color: #dc2626;">-${data.platformCommission.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="color: #059669;"><strong>Ihre Auszahlung:</strong></td>
                <td style="text-align: right; color: #059669; font-weight: bold;">${data.workshopPayout.toFixed(2)}€</td>
              </tr>
              ${(() => {
                // Calculate real supplier costs with 19% VAT
                let supplierCostsWithVAT = 0;
                if (data.tireData?.isMixedTires) {
                  const frontCost = data.tireData.front?.supplierTotal || 0;
                  const rearCost = data.tireData.rear?.supplierTotal || 0;
                  supplierCostsWithVAT = (frontCost + rearCost) * 1.19;
                } else if (data.tireData?.supplierTotal) {
                  supplierCostsWithVAT = data.tireData.supplierTotal * 1.19;
                }
                
                return supplierCostsWithVAT > 0 ? `
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="color: #f59e0b;">Ihre Reifen-Einkaufskosten (inkl. MwSt.):</td>
                <td style="text-align: right; color: #f59e0b;">-${supplierCostsWithVAT.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="color: #10b981; font-size: 18px;"><strong>Ihr Gewinn (nach EK):</strong></td>
                <td style="text-align: right; color: #10b981; font-size: 20px; font-weight: bold;">${((data.workshopPayout) - supplierCostsWithVAT).toFixed(2)}€</td>
              </tr>
              ` : '';
              })()}
            </table>
            
            <p style="margin-top: 15px; padding: 12px; background: #dbeafe; border-radius: 6px; font-size: 14px;">
              ℹ️ Der Betrag von <strong>${data.workshopPayout.toFixed(2)}€</strong> wird automatisch auf Ihr 
              Stripe-Konto überwiesen (Auszahlung je nach Einstellung: täglich/wöchentlich).
            </p>
          </div>

          ${data.customerNotes ? `
          <div style="padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
            <strong>💬 Nachricht vom Kunden:</strong><br>
            "${data.customerNotes}"
          </div>
          ` : ''}

          <!-- Next Steps -->
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="margin-top: 0;">✅ Ihre nächsten Schritte:</h3>
            <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              ${isTireService && isCSVSupplier ? `<li><strong style="color: #d97706;">🛒 REIFEN BESTELLEN</strong> beim Lieferanten ${data.supplierName || ''}<br><small style="color: #6b7280;">EAN: ${data.tireEAN || 'siehe oben'}, Menge: ${data.tireQuantity || 4} Stück</small></li>` : ''}
              ${isTireService && isAPISupplier ? `<li>✅ Reifen sind bestellt - keine Aktion erforderlich</li>` : ''}
              ${isTireService ? `<li>📦 Liefertermin${isAPISupplier ? ' abwarten' : ' bestätigen lassen'}</li>` : ''}
              <li>📞 Bei Änderungen Kunden kontaktieren: ${data.customerPhone}</li>
              <li>🔧 Termin ausführen am ${data.appointmentDate} um ${data.appointmentTime} Uhr</li>
              <li>🧾 Rechnung an Kunden ausstellen über ${data.totalPrice.toFixed(2)}€</li>
            </ol>
          </div>

          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/workshop/bookings" class="button">
              Alle Buchungen ansehen
            </a>
          </center>

          <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">
            <strong>Hinweis:</strong> Der Termin wurde bereits automatisch in Ihrem verbundenen Google Kalender eingetragen.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Bereifung24</strong> - Partner-Werkstatt-System</p>
          <p>Bei Fragen: support@bereifung24.de</p>
        </div>
      </div>
    </body>
    </html>
    `
  }
}

export function sepaMandateActivatedEmailTemplate(data: {
  workshopName: string
  companyName: string
  mandateReference: string
  activatedAt: string
}) {
  return {
    subject: 'SEPA-Lastschriftmandat aktiviert - Sie können jetzt Angebote erstellen',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white; 
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 30px 20px;
        }
        .success-icon {
          text-align: center;
          font-size: 64px;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #6b7280;
        }
        .info-value {
          color: #111827;
        }
        .button { 
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 14px 32px; 
          text-decoration: none; 
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
          text-align: center;
        }
        .button:hover {
          opacity: 0.9;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .footer { 
          background: #f3f4f6;
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .footer p {
          margin: 5px 0;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 SEPA-Mandat aktiviert!</h1>
        </div>
        
        <div class="content">
          <div class="success-icon">✅</div>
          
          <p>Sehr geehrte Damen und Herren von <strong>${data.companyName}</strong>,</p>
          
          <div class="highlight">
            <p style="margin: 0; font-size: 18px; font-weight: 600;">
              Ihr SEPA-Lastschriftmandat wurde erfolgreich aktiviert!
            </p>
          </div>
          
          <p>
            Gute Nachrichten: GoCardless hat Ihr SEPA-Lastschriftmandat geprüft und aktiviert. 
            Sie können ab sofort Angebote auf Kundenanfragen erstellen.
          </p>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Mandatsreferenz:</span>
              <span class="info-value"><strong>${data.mandateReference}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Aktiviert am:</span>
              <span class="info-value">${data.activatedAt}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" style="color: #10b981; font-weight: 600;">✓ Aktiv</span>
            </div>
          </div>

          <h3 style="color: #667eea; margin-top: 30px;">Was bedeutet das für Sie?</h3>
          <ul>
            <li><strong>Angebote erstellen:</strong> Sie können jetzt auf alle Kundenanfragen mit Angeboten reagieren</li>
            <li><strong>Automatische Abrechnung:</strong> Ihre Provisionen werden monatlich per SEPA-Lastschrift eingezogen</li>
            <li><strong>Keine manuelle Zahlung:</strong> Sie müssen sich um nichts kümmern - alles läuft automatisch</li>
          </ul>

          <div class="button-container">
            <a href="${process.env.NEXTAUTH_URL || 'https://www.bereifung24.de'}/dashboard/workshop/browse-requests" class="button">
              Jetzt Anfragen durchsuchen
            </a>
          </div>

          <p style="margin-top: 30px;">
            Bei Fragen zu Ihrem SEPA-Mandat oder der Abrechnung können Sie sich jederzeit an uns wenden.
          </p>

          <p>
            Viel Erfolg mit Bereifung24!<br>
            Ihr Bereifung24-Team
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

// ============================================
// INFLUENCER PAYMENT CONFIRMATION
// ============================================

export function influencerPaymentConfirmationEmailTemplate(data: {
  influencerName: string
  amount: string
  periodStart: string
  periodEnd: string
  totalClicks: number
  clicksAmount: string
  totalRegistrations: number
  registrationsAmount: string
  totalOffers: number
  offersAmount: string
  paymentMethod: string
  paymentReference?: string
  paidAt: string
}) {
  return {
    subject: 'Ihre Auszahlung wurde durchgeführt - Bereifung24',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .success-badge {
          text-align: center;
          margin: 20px 0;
        }
        .success-badge .icon {
          font-size: 48px;
          color: #10b981;
        }
        .amount-box {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 25px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .amount-box .label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .amount-box .amount {
          font-size: 36px;
          font-weight: bold;
          margin: 0;
        }
        .info-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 500;
          color: #6b7280;
        }
        .info-value {
          font-weight: 600;
          color: #111827;
        }
        .breakdown {
          margin: 20px 0;
        }
        .breakdown-item {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .breakdown-title {
          font-weight: 600;
          color: #111827;
        }
        .breakdown-amount {
          font-weight: 700;
          color: #059669;
          font-size: 18px;
        }
        .breakdown-details {
          font-size: 14px;
          color: #6b7280;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .button-container {
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Auszahlung durchgeführt</h1>
        </div>
        
        <div class="content">
          <div class="success-badge">
            <div class="icon">✅</div>
          </div>

          <p>Hallo ${data.influencerName},</p>
          
          <p>
            großartige Neuigkeiten! Ihre Auszahlung wurde erfolgreich durchgeführt.
          </p>

          <div class="amount-box">
            <div class="label">Ausgezahlter Betrag</div>
            <div class="amount">${data.amount}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Zeitraum</span>
              <span class="info-value">${data.periodStart} - ${data.periodEnd}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Zahlungsmethode</span>
              <span class="info-value">${data.paymentMethod === 'BANK_TRANSFER' ? 'Banküberweisung' : 'PayPal'}</span>
            </div>
            ${data.paymentReference ? `
            <div class="info-row">
              <span class="info-label">Transaktions-ID</span>
              <span class="info-value">${data.paymentReference}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Ausgezahlt am</span>
              <span class="info-value">${data.paidAt}</span>
            </div>
          </div>

          <h3 style="color: #111827; margin-top: 30px;">📊 Aufschlüsselung</h3>
          
          <div class="breakdown">
            ${data.totalClicks > 0 ? `
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-title">👆 Page Views (CPM)</span>
                <span class="breakdown-amount">${data.clicksAmount}</span>
              </div>
              <div class="breakdown-details">${data.totalClicks} Klicks</div>
            </div>
            ` : ''}
            
            ${data.totalRegistrations > 0 ? `
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-title">👤 Registrierungen</span>
                <span class="breakdown-amount">${data.registrationsAmount}</span>
              </div>
              <div class="breakdown-details">${data.totalRegistrations} Registrierungen</div>
            </div>
            ` : ''}
            
            ${data.totalOffers > 0 ? `
            <div class="breakdown-item">
              <div class="breakdown-header">
                <span class="breakdown-title">✅ Akzeptierte Angebote</span>
                <span class="breakdown-amount">${data.offersAmount}</span>
              </div>
              <div class="breakdown-details">${data.totalOffers} Angebote</div>
            </div>
            ` : ''}
          </div>

          <p style="margin-top: 30px; background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <strong>💡 Tipp:</strong> Die Zahlung sollte in den nächsten ${data.paymentMethod === 'PAYPAL' ? '1-2' : '2-3'} Werktagen auf Ihrem Konto eingehen.
          </p>

          <div class="button-container">
            <a href="${process.env.NEXTAUTH_URL || 'https://www.bereifung24.de'}/influencer/payments" class="button">
              Zahlungshistorie ansehen
            </a>
          </div>

          <p style="margin-top: 30px;">
            Vielen Dank für Ihre großartige Arbeit! Wir freuen uns auf weitere erfolgreiche Zusammenarbeit.
          </p>

          <p>
            Bei Fragen zur Auszahlung stehen wir Ihnen gerne zur Verfügung.<br>
            Ihr Bereifung24-Team
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
