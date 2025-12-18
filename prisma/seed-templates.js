const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding basic email templates...')

  const templates = [
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
    const result = await prisma.emailTemplate.upsert({
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
