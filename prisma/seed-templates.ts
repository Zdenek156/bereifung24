import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding email templates...')

  const templates = [
    {
      id: 'tpl_welcome_customer_001',
      key: 'WELCOME_CUSTOMER',
      name: 'Willkommen - Kunde',
      description: 'Willkommens-Email für neue Kunden nach der Registrierung',
      subject: 'Willkommen bei Bereifung24!',
      htmlContent: `<!DOCTYPE html>
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
      <p><strong>Hallo {{firstName}},</strong></p>
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
        <a href="{{loginUrl}}" class="button">
          Jetzt anmelden
        </a>
      </div>

      <p>Deine Login-Daten:</p>
      <ul>
        <li><strong>E-Mail:</strong> {{email}}</li>
        <li><strong>Passwort:</strong> Das von dir gewählte Passwort</li>
      </ul>

      <p>Bei Fragen stehen wir dir gerne zur Verfügung!</p>
      <p>Viel Erfolg beim Finden der besten Reifen!</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Deine Plattform für Reifenwechsel und mehr</p>
      <p style="margin-top: 10px;">
        <a href="{{baseUrl}}" style="color: #667eea;">bereifung24.de</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'firstName', description: 'Vorname des Kunden' },
        { key: 'email', description: 'E-Mail-Adresse des Kunden' },
        { key: 'loginUrl', description: 'URL zur Login-Seite' },
        { key: 'baseUrl', description: 'Basis-URL der Plattform' }
      ]),
      isActive: true
    },
    {
      id: 'tpl_booking_customer_006',
      key: 'BOOKING_CONFIRMATION_CUSTOMER',
      name: 'Terminbestätigung - Kunde',
      description: 'Bestätigung des gebuchten Termins für den Kunden',
      subject: 'Terminbestätigung - {{workshopName}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .appointment-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Termin bestätigt!</h1>
    </div>
    <div class="content">
      <p><strong>Hallo {{customerName}},</strong></p>
      <p>Ihr Termin wurde erfolgreich gebucht!</p>

      <div class="appointment-box">
        <h3 style="margin-top: 0; color: #059669;">Termindetails</h3>
        <div class="info-row">
          <strong>📅 Datum:</strong> {{appointmentDate}}
        </div>
        <div class="info-row">
          <strong>🕐 Uhrzeit:</strong> {{appointmentTime}} Uhr
        </div>
        <div class="info-row">
          <strong>🏭 Werkstatt:</strong> {{workshopName}}
        </div>
        <div class="info-row">
          <strong>📍 Adresse:</strong> {{workshopAddress}}
        </div>
        <div class="info-row">
          <strong>📞 Telefon:</strong> {{workshopPhone}}
        </div>
        <div class="info-row">
          <strong>🔧 Leistung:</strong> {{serviceName}}
        </div>
        <div class="info-row">
          <strong>💰 Preis:</strong> {{price}} €
        </div>
      </div>

      <p style="text-align: center; color: #6b7280;">
        💡 <strong>Tipp:</strong> Diese E-Mail enthält eine ICS-Kalenderdatei im Anhang. 
        Öffnen Sie den Anhang, um den Termin automatisch in Ihren Kalender einzutragen.
      </p>

      <p style="margin-top: 30px;">Wir freuen uns auf Ihren Besuch!</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Deine Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'appointmentDate', description: 'Datum des Termins' },
        { key: 'appointmentTime', description: 'Uhrzeit des Termins' },
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'workshopAddress', description: 'Adresse der Werkstatt' },
        { key: 'workshopPhone', description: 'Telefonnummer der Werkstatt' },
        { key: 'serviceName', description: 'Art der Dienstleistung' },
        { key: 'price', description: 'Preis der Dienstleistung' }
      ]),
      isActive: true
    },
    {
      id: 'tpl_booking_workshop_007',
      key: 'BOOKING_CONFIRMATION_WORKSHOP',
      name: 'Terminbestätigung - Werkstatt',
      description: 'Benachrichtigung an Werkstatt über neue Buchung',
      subject: 'Neue Buchung: {{customerName}} - {{serviceName}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .booking-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin: 20px 0; }
    .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .calendar-notice { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Neue Buchung!</h1>
    </div>
    <div class="content">
      <p><strong>Neue Terminbuchung erhalten</strong></p>

      <div class="booking-box">
        <h3 style="margin-top: 0; color: #667eea;">Termindetails</h3>
        <div class="info-row">
          <strong>📅 Datum:</strong> {{appointmentDate}}
        </div>
        <div class="info-row">
          <strong>🕐 Uhrzeit:</strong> {{appointmentTime}} Uhr
        </div>
        <div class="info-row">
          <strong>🔧 Leistung:</strong> {{serviceName}}
        </div>
      </div>

      <div class="booking-box">
        <h3 style="margin-top: 0; color: #667eea;">Kundendaten</h3>
        <div class="info-row">
          <strong>👤 Name:</strong> {{customerName}}
        </div>
        <div class="info-row">
          <strong>📞 Telefon:</strong> {{customerPhone}}
        </div>
        <div class="info-row">
          <strong>✉️ E-Mail:</strong> {{customerEmail}}
        </div>
        <div class="info-row">
          <strong>📍 Adresse:</strong> {{customerAddress}}
        </div>
      </div>

      <div class="booking-box">
        <h3 style="margin-top: 0; color: #667eea;">Fahrzeugdaten</h3>
        <div class="info-row">
          <strong>🚗 Fahrzeug:</strong> {{vehicleInfo}}
        </div>
        <div class="info-row">
          <strong>💰 Preis:</strong> {{price}} €
        </div>
      </div>

      <div class="calendar-notice">
        <p style="margin: 0;"><strong>📅 Google Kalender:</strong> Der Termin wurde automatisch in Ihren 
        verbundenen Google Kalender eingetragen. Sie finden dort alle Details zum 
        Auftrag inklusive Kundeninformationen und Fahrzeugdaten.</p>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Bitte bereiten Sie alles für den Termin vor.
      </p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Partner-Plattform für Reifenservice</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'appointmentDate', description: 'Datum des Termins' },
        { key: 'appointmentTime', description: 'Uhrzeit des Termins' },
        { key: 'serviceName', description: 'Art der Dienstleistung' },
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'customerPhone', description: 'Telefonnummer des Kunden' },
        { key: 'customerEmail', description: 'E-Mail des Kunden' },
        { key: 'customerAddress', description: 'Adresse des Kunden' },
        { key: 'vehicleInfo', description: 'Fahrzeuginformationen' },
        { key: 'price', description: 'Preis der Dienstleistung' }
      ]),
      isActive: true
    }
  ]

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: template,
      create: template
    })
    console.log(`✓ Template ${template.key} added/updated`)
  }

  console.log('✅ Email templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
