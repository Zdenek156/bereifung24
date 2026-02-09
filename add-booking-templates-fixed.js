const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addBookingConfirmationTemplates() {
  try {
    console.log('📧 Füge Buchungsbestätigungs-Email-Templates hinzu...\n')

    // Customer booking confirmation template
    const customerTemplate = await prisma.emailTemplate.upsert({
      where: { key: 'BOOKING_CONFIRMATION_CUSTOMER' },
      update: {
        name: 'Buchungsbestätigung - Kunde',
        subject: 'Ihre Buchung bei {{workshopName}} wurde bestätigt',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">✅ Buchung bestätigt!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ihre Zahlung war erfolgreich</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hallo {{customerName}},</p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Ihre Buchung wurde erfolgreich bestätigt und bezahlt. Die Werkstatt wurde benachrichtigt und erwartet Sie zum vereinbarten Termin.</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">📅 Termindetails</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Werkstatt:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{workshopName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Adresse:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{workshopAddress}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{serviceName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{time}} Uhr</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fahrzeug:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{vehicle}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Preis:</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 16px; font-weight: 700;">{{price}} (bereits bezahlt)</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.5;">📎 <strong>Kalendertermin hinzufügen:</strong><br>Im Anhang finden Sie eine ICS-Datei, die Sie in Ihren Kalender (Google Calendar, Outlook, Apple Calendar, etc.) importieren können.</p>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;"><strong>⚠️ Wichtig:</strong><br>Bitte seien Sie pünktlich zum Termin. Bei Verspätung von mehr als 15 Minuten kann der Termin verfallen.</p>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">Sie können Ihre Buchung jederzeit in Ihrem Dashboard verwalten:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zum Dashboard</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">Bei Fragen wenden Sie sich bitte direkt an die Werkstatt:<br>📞 {{workshopPhone}}<br>📧 {{workshopEmail}}</p>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Vielen Dank für Ihre Buchung!<br><strong>Ihr Bereifung24 Team</strong></p>
  </div>
</div>`,
        description: 'Buchungsbestätigung an den Kunden nach erfolgreicher Zahlung (mit ICS-Anhang)',
        placeholders: JSON.stringify([
          { key: 'customerName', description: 'Name des Kunden' },
          { key: 'workshopName', description: 'Name der Werkstatt' },
          { key: 'workshopAddress', description: 'Adresse der Werkstatt' },
          { key: 'serviceName', description: 'Name der Dienstleistung (z.B. Räderwechsel)' },
          { key: 'date', description: 'Termindatum (formatiert)' },
          { key: 'time', description: 'Uhrzeit des Termins' },
          { key: 'vehicle', description: 'Fahrzeuginfo (Marke, Modell)' },
          { key: 'price', description: 'Gesamtpreis' },
          { key: 'dashboardUrl', description: 'Link zum Kunden-Dashboard' },
          { key: 'workshopPhone', description: 'Telefonnummer der Werkstatt' },
          { key: 'workshopEmail', description: 'Email der Werkstatt' }
        ]),
        isActive: true
      },
      create: {
        key: 'BOOKING_CONFIRMATION_CUSTOMER',
        name: 'Buchungsbestätigung - Kunde',
        subject: 'Ihre Buchung bei {{workshopName}} wurde bestätigt',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">✅ Buchung bestätigt!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ihre Zahlung war erfolgreich</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hallo {{customerName}},</p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Ihre Buchung wurde erfolgreich bestätigt und bezahlt. Die Werkstatt wurde benachrichtigt und erwartet Sie zum vereinbarten Termin.</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">📅 Termindetails</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Werkstatt:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{workshopName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Adresse:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{workshopAddress}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{serviceName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{time}} Uhr</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fahrzeug:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{vehicle}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Preis:</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 16px; font-weight: 700;">{{price}} (bereits bezahlt)</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.5;">📎 <strong>Kalendertermin hinzufügen:</strong><br>Im Anhang finden Sie eine ICS-Datei, die Sie in Ihren Kalender (Google Calendar, Outlook, Apple Calendar, etc.) importieren können.</p>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;"><strong>⚠️ Wichtig:</strong><br>Bitte seien Sie pünktlich zum Termin. Bei Verspätung von mehr als 15 Minuten kann der Termin verfallen.</p>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">Sie können Ihre Buchung jederzeit in Ihrem Dashboard verwalten:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zum Dashboard</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">Bei Fragen wenden Sie sich bitte direkt an die Werkstatt:<br>📞 {{workshopPhone}}<br>📧 {{workshopEmail}}</p>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Vielen Dank für Ihre Buchung!<br><strong>Ihr Bereifung24 Team</strong></p>
  </div>
</div>`,
        description: 'Buchungsbestätigung an den Kunden nach erfolgreicher Zahlung (mit ICS-Anhang)',
        placeholders: JSON.stringify([
          { key: 'customerName', description: 'Name des Kunden' },
          { key: 'workshopName', description: 'Name der Werkstatt' },
          { key: 'workshopAddress', description: 'Adresse der Werkstatt' },
          { key: 'serviceName', description: 'Name der Dienstleistung (z.B. Räderwechsel)' },
          { key: 'date', description: 'Termindatum (formatiert)' },
          { key: 'time', description: 'Uhrzeit des Termins' },
          { key: 'vehicle', description: 'Fahrzeuginfo (Marke, Modell)' },
          { key: 'price', description: 'Gesamtpreis' },
          { key: 'dashboardUrl', description: 'Link zum Kunden-Dashboard' },
          { key: 'workshopPhone', description: 'Telefonnummer der Werkstatt' },
          { key: 'workshopEmail', description: 'Email der Werkstatt' }
        ]),
        isActive: true
      }
    })

    console.log('✅ Customer template created/updated:', customerTemplate.key)

    // Workshop booking notification template
    const workshopTemplate = await prisma.emailTemplate.upsert({
      where: { key: 'BOOKING_CONFIRMATION_WORKSHOP' },
      update: {
        name: 'Buchungsbenachrichtigung - Werkstatt',
        subject: '🔔 Neue Buchung: {{serviceName}} am {{date}}',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🔔 Neue Buchung</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ein Kunde hat einen Termin gebucht und bezahlt</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hallo {{workshopName}},</p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Sie haben eine neue Buchung erhalten. Der Kunde hat bereits bezahlt und erwartet den Service zum vereinbarten Termin.</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">👤 Kundendaten</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Name:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{customerName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{customerEmail}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Telefon:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{customerPhone}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">📅 Service & Termin</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Service:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{serviceName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{time}} Uhr</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fahrzeug:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{vehicle}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Kennzeichen:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{licensePlate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Preis:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{price}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; margin: 25px 0; border-radius: 6px; text-align: center;">
      <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.5;"><strong>✅ Zahlung bereits erhalten</strong><br>Der Kunde hat den Service bereits vollständig bezahlt.</p>
    </div>
    
    <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">📅 <strong>Google Calendar:</strong><br>Der Termin wurde automatisch in Ihrem Google Kalender eingetragen (falls verbunden).</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zur Terminverwaltung</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">Bei Fragen kontaktieren Sie den Kunden direkt über die oben angegebenen Kontaktdaten.</p>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Beste Grüße,<br><strong>Ihr Bereifung24 Team</strong></p>
  </div>
</div>`,
        description: 'Benachrichtigung an die Werkstatt über eine neue Buchung',
        placeholders: JSON.stringify([
          { key: 'workshopName', description: 'Name der Werkstatt' },
          { key: 'customerName', description: 'Name des Kunden' },
          { key: 'customerEmail', description: 'Email des Kunden' },
          { key: 'customerPhone', description: 'Telefon des Kunden' },
          { key: 'serviceName', description: 'Name der Dienstleistung' },
          { key: 'date', description: 'Termindatum (formatiert)' },
          { key: 'time', description: 'Uhrzeit des Termins' },
          { key: 'vehicle', description: 'Fahrzeuginfo (Marke, Modell)' },
          { key: 'licensePlate', description: 'Kennzeichen' },
          { key: 'price', description: 'Gesamtpreis' },
          { key: 'dashboardUrl', description: 'Link zum Werkstatt-Dashboard' }
        ]),
        isActive: true
      },
      create: {
        key: 'BOOKING_CONFIRMATION_WORKSHOP',
        name: 'Buchungsbenachrichtigung - Werkstatt',
        subject: '🔔 Neue Buchung: {{serviceName}} am {{date}}',
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🔔 Neue Buchung</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ein Kunde hat einen Termin gebucht und bezahlt</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hallo {{workshopName}},</p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Sie haben eine neue Buchung erhalten. Der Kunde hat bereits bezahlt und erwartet den Service zum vereinbarten Termin.</p>
    
    <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">👤 Kundendaten</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Name:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{customerName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{customerEmail}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Telefon:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{customerPhone}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">📅 Service & Termin</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Service:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{serviceName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{time}} Uhr</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fahrzeug:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{vehicle}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Kennzeichen:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">{{licensePlate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Preis:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{price}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; margin: 25px 0; border-radius: 6px; text-align: center;">
      <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.5;"><strong>✅ Zahlung bereits erhalten</strong><br>Der Kunde hat den Service bereits vollständig bezahlt.</p>
    </div>
    
    <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.5;">📅 <strong>Google Calendar:</strong><br>Der Termin wurde automatisch in Ihrem Google Kalender eingetragen (falls verbunden).</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zur Terminverwaltung</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">Bei Fragen kontaktieren Sie den Kunden direkt über die oben angegebenen Kontaktdaten.</p>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">Beste Grüße,<br><strong>Ihr Bereifung24 Team</strong></p>
  </div>
</div>`,
        description: 'Benachrichtigung an die Werkstatt über eine neue Buchung',
        placeholders: JSON.stringify([
          { key: 'workshopName', description: 'Name der Werkstatt' },
          { key: 'customerName', description: 'Name des Kunden' },
          { key: 'customerEmail', description: 'Email des Kunden' },
          { key: 'customerPhone', description: 'Telefon des Kunden' },
          { key: 'serviceName', description: 'Name der Dienstleistung' },
          { key: 'date', description: 'Termindatum (formatiert)' },
          { key: 'time', description: 'Uhrzeit des Termins' },
          { key: 'vehicle', description: 'Fahrzeuginfo (Marke, Modell)' },
          { key: 'licensePlate', description: 'Kennzeichen' },
          { key: 'price', description: 'Gesamtpreis' },
          { key: 'dashboardUrl', description: 'Link zum Werkstatt-Dashboard' }
        ]),
        isActive: true
      }
    })

    console.log('✅ Workshop template created/updated:', workshopTemplate.key)

    console.log('\n✅ Beide Email-Templates wurden erfolgreich hinzugefügt!')
    console.log('\n📝 Verfügbare Placeholders:')
    console.log('Customer Template:', JSON.parse(customerTemplate.placeholders).map(p => `{{${p.key}}}`).join(', '))
    console.log('Workshop Template:', JSON.parse(workshopTemplate.placeholders).map(p => `{{${p.key}}}`).join(', '))
    console.log('\n✅ Templates sind jetzt im Admin-Panel unter /admin/email-templates verfügbar')

  } catch (error) {
    console.error('❌ Fehler:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addBookingConfirmationTemplates()
  .then(() => {
    console.log('\n✅ Script erfolgreich ausgeführt')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script fehlgeschlagen:', error)
    process.exit(1)
  })
