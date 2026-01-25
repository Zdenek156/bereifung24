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
    },
    {
      id: 'tpl_monthly_invoice_001',
      key: 'MONTHLY_INVOICE_WORKSHOP',
      name: 'Monatliche Provisionsrechnung - Werkstatt',
      description: 'Monatliche Rechnung mit Provisionszusammenfassung für Werkstätten (wird am 1. des Folgemonats versendet)',
      subject: 'Ihre Provisionsrechnung {{invoiceNumber}} für {{periodMonth}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 650px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 35px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 35px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .invoice-box { background: #eff6ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 8px; margin: 25px 0; }
    .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
    .detail-row { padding: 10px; background: white; border-radius: 4px; }
    .detail-label { color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { color: #111827; font-size: 16px; font-weight: bold; margin-top: 5px; }
    .amount-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
    .amount-label { font-size: 14px; opacity: 0.9; }
    .amount-value { font-size: 32px; font-weight: bold; margin-top: 10px; }
    .info-section { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-section h3 { color: #1f2937; margin-top: 0; font-size: 16px; }
    .button { display: inline-block; padding: 14px 28px; background: #2563eb; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; transition: background 0.3s; }
    .button:hover { background: #1d4ed8; }
    .commission-list { list-style: none; padding: 0; margin: 15px 0; }
    .commission-item { padding: 12px; background: white; margin: 8px 0; border-radius: 6px; border-left: 3px solid #3b82f6; display: flex; justify-content: space-between; align-items: center; }
    .footer { text-align: center; margin-top: 30px; padding: 25px; font-size: 13px; color: #6b7280; background: white; border-radius: 8px; }
    .payment-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .payment-notice strong { color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Ihre Provisionsrechnung</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">Monatliche Abrechnung für {{periodMonth}}</p>
    </div>
    <div class="content">
      <p><strong>Sehr geehrte Damen und Herren von {{workshopName}},</strong></p>
      
      <p>anbei erhalten Sie Ihre Provisionsrechnung für den Monat {{periodMonth}}.</p>

      <div class="invoice-box">
        <h3 style="margin-top: 0; color: #1e40af;">Rechnungsdetails</h3>
        <div class="invoice-details">
          <div class="detail-row">
            <div class="detail-label">Rechnungsnummer</div>
            <div class="detail-value">{{invoiceNumber}}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Rechnungsdatum</div>
            <div class="detail-value">{{invoiceDate}}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Leistungszeitraum</div>
            <div class="detail-value">{{periodStart}} - {{periodEnd}}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Anzahl Aufträge</div>
            <div class="detail-value">{{commissionCount}}</div>
          </div>
        </div>
      </div>

      <div class="amount-box">
        <div class="amount-label">Rechnungsbetrag (inkl. 19% MwSt.)</div>
        <div class="amount-value">{{totalAmount}}</div>
      </div>

      <div class="payment-notice">
        <strong>💳 Zahlung per SEPA-Lastschrift</strong><br>
        Der Rechnungsbetrag wird automatisch von Ihrem hinterlegten Bankkonto abgebucht.<br>
        <small style="color: #78716c;">Mandatsreferenz: {{sepaReference}}</small>
      </div>

      <div class="info-section">
        <h3>📊 Zusammenfassung der Provisionen</h3>
        <ul class="commission-list">
          {{commissionItems}}
        </ul>
        <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
          Die detaillierte Aufstellung finden Sie im angehängten PDF-Dokument.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invoiceUrl}}" class="button">
          📥 Rechnung als PDF herunterladen
        </a>
      </div>

      <div class="info-section">
        <h3>ℹ️ Wichtige Informationen</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li>Diese Rechnung enthält strukturierte Daten nach ZUGFeRD 2.2 Standard</li>
          <li>Sie können die PDF direkt in Ihre Buchhaltungssoftware importieren</li>
          <li>Bei Fragen zur Rechnung wenden Sie sich bitte an unsere Buchhaltung</li>
        </ul>
      </div>

      <p style="margin-top: 30px;">Vielen Dank für Ihre Zusammenarbeit!</p>
      <p><strong>Ihr Bereifung24 Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24 GmbH</strong></p>
      <p>Jahnstraße 2 • 71706 Markgröningen • Deutschland</p>
      <p>Tel: 07147 - 9679990 • E-Mail: buchhaltung@bereifung24.de</p>
      <p style="margin-top: 15px; font-size: 11px;">
        USt-IdNr.: DE354910030<br>
        Geschäftsführer: Zdenek Kyzlink
      </p>
      <p style="margin-top: 10px;">
        <a href="https://www.bereifung24.de" style="color: #2563eb;">www.bereifung24.de</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'invoiceNumber', description: 'Rechnungsnummer (z.B. B24-INV-2025-0007)' },
        { key: 'invoiceDate', description: 'Datum der Rechnungserstellung' },
        { key: 'periodMonth', description: 'Monat der Abrechnung (z.B. "Dezember 2025")' },
        { key: 'periodStart', description: 'Start des Leistungszeitraums (z.B. "01.12.2025")' },
        { key: 'periodEnd', description: 'Ende des Leistungszeitraums (z.B. "31.12.2025")' },
        { key: 'commissionCount', description: 'Anzahl der abgerechneten Aufträge' },
        { key: 'totalAmount', description: 'Gesamtbetrag inkl. MwSt. (formatiert mit €)' },
        { key: 'sepaReference', description: 'SEPA-Mandatsreferenz' },
        { key: 'commissionItems', description: 'HTML-Liste mit Provisions-Positionen' },
        { key: 'invoiceUrl', description: 'URL zum Download der PDF-Rechnung' }
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
