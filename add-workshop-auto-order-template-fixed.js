const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addAutoOrderWorkshopTemplate() {
  try {
    console.log('📧 Füge Auto-Order Werkstatt Email-Template hinzu...\n')

    const htmlTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🔔 Neue Buchung!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ein Kunde hat gebucht und bezahlt - Reifen automatisch bestellt</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Hallo {{workshopName}},
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Sie haben eine neue, bestätigte Buchung erhalten. Die Zahlung wurde bereits vom Kunden geleistet und die <strong>Reifen wurden automatisch bei Ihrem Lieferanten bestellt</strong>.
    </p>
    
    <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">📋 Buchungsdetails</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 130px;">Kunde:</td>
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
        <tr style="height: 10px;"></tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: 700;">{{serviceName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Datum:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: 700;">{{date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Uhrzeit:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: 700;">{{time}} Uhr</td>
        </tr>
        <tr style="height: 10px;"></tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fahrzeug:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{vehicle}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Kennzeichen:</td>
          <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">{{licensePlate}}</td>
        </tr>
        <tr style="height: 10px;"></tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Preis:</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 18px; font-weight: 700;">{{price}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Zahlungsstatus:</td>
          <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 700;">✅ Bereits bezahlt</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #d1fae5; border: 2px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px;">
      <h3 style="color: #065f46; font-size: 16px; margin: 0 0 12px 0; display: flex; align-items: center;">
        <span style="font-size: 24px; margin-right: 10px;">✅</span>
        <span>Reifen automatisch bestellt</span>
      </h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #065f46; font-size: 14px; width: 130px;">Reifen:</td>
          <td style="padding: 6px 0; color: #064e3b; font-size: 14px; font-weight: 700;">{{tireBrand}} {{tireModel}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Größe:</td>
          <td style="padding: 6px 0; color: #064e3b; font-size: 14px; font-weight: 700;">{{tireSize}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Menge:</td>
          <td style="padding: 6px 0; color: #064e3b; font-size: 14px; font-weight: 700;">{{tireQuantity}} Stück</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Lieferant:</td>
          <td style="padding: 6px 0; color: #064e3b; font-size: 14px; font-weight: 600;">{{supplierName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Bestellnummer:</td>
          <td style="padding: 6px 0; color: #064e3b; font-size: 14px; font-weight: 600; font-family: monospace;">{{orderReference}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Liefertermin:</td>
          <td style="padding: 6px 0; color: #064e3b; font-size: 14px; font-weight: 600;">{{deliveryDate}}</td>
        </tr>
      </table>
      
      <p style="color: #065f46; font-size: 13px; margin: 15px 0 0 0; line-height: 1.5;">
        <strong>💡 Hinweis:</strong> Die Reifen wurden automatisch über Ihre API-Anbindung beim Lieferanten bestellt. Bitte prüfen Sie die Lieferung rechtzeitig vor dem Termin.
      </p>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
        <strong>📅 Google Kalender:</strong><br>
        Der Termin wurde automatisch in Ihrem Google Kalender eingetragen (falls verbunden).
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Buchung im Dashboard ansehen
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Diese Benachrichtigung wurde automatisch von Bereifung24 gesendet.
    </p>
  </div>
</div>
`

    const placeholders = JSON.stringify([
      { key: 'workshopName', description: 'Name der Werkstatt' },
      { key: 'customerName', description: 'Name des Kunden' },
      { key: 'customerEmail', description: 'Email des Kunden' },
      { key: 'customerPhone', description: 'Telefon des Kunden' },
      { key: 'serviceName', description: 'Name der Dienstleistung' },
      { key: 'date', description: 'Termin-Datum' },
      { key: 'time', description: 'Termin-Uhrzeit' },
      { key: 'vehicle', description: 'Fahrzeug' },
      { key: 'licensePlate', description: 'Kennzeichen' },
      { key: 'price', description: 'Preis' },
      { key: 'tireBrand', description: 'Reifen-Marke' },
      { key: 'tireModel', description: 'Reifen-Modell' },
      { key: 'tireSize', description: 'Reifengröße' },
      { key: 'tireQuantity', description: 'Reifenmenge' },
      { key: 'supplierName', description: 'Lieferantenname' },
      { key: 'orderReference', description: 'Bestellnummer' },
      { key: 'deliveryDate', description: 'Liefertermin' },
      { key: 'dashboardUrl', description: 'Link zum Dashboard' }
    ])

    // Template für Werkstatt mit automatischer Bestellung
    const autoOrderTemplate = await prisma.emailTemplate.upsert({
      where: { key: 'BOOKING_CONFIRMATION_WORKSHOP_AUTO_ORDER' },
      update: {
        name: 'Terminbestätigung - Werkstatt (Auto-Order)',
        subject: '🔔 Neue Buchung: {{serviceName}} am {{date}} - Reifen bereits bestellt',
        htmlContent: htmlTemplate,
        description: 'Benachrichtigung an die Werkstatt bei neuer Buchung mit automatischer Reifenbestellung (Auto-Order aktiviert)',
        placeholders: placeholders,
        isActive: true
      },
      create: {
        key: 'BOOKING_CONFIRMATION_WORKSHOP_AUTO_ORDER',
        name: 'Terminbestätigung - Werkstatt (Auto-Order)',
        subject: '🔔 Neue Buchung: {{serviceName}} am {{date}} - Reifen bereits bestellt',
        htmlContent: htmlTemplate,
        description: 'Benachrichtigung an die Werkstatt bei neuer Buchung mit automatischer Reifenbestellung (Auto-Order aktiviert)',
        placeholders: placeholders,
        isActive: true
      }
    })

    console.log('✅ Auto-Order Workshop Template erstellt:', autoOrderTemplate.key)
    console.log('\n✅ Email-Template erfolgreich hinzugefügt!')
    console.log('\n📝 Verwendung:')
    console.log('   - Wenn Workshop autoOrder = true: BOOKING_CONFIRMATION_WORKSHOP_AUTO_ORDER')
    console.log('   - Wenn Workshop autoOrder = false: BOOKING_CONFIRMATION_WORKSHOP')
    console.log('\n📝 Verfügbare Platzhalter:')
    console.log('   Basis: {{workshopName}}, {{customerName}}, {{customerEmail}}, {{customerPhone}}')
    console.log('   Termin: {{serviceName}}, {{date}}, {{time}}, {{vehicle}}, {{licensePlate}}, {{price}}')
    console.log('   Reifen: {{tireBrand}}, {{tireModel}}, {{tireSize}}, {{tireQuantity}}')
    console.log('   Bestellung: {{supplierName}}, {{orderReference}}, {{deliveryDate}}')
    console.log('   System: {{dashboardUrl}}')

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addAutoOrderWorkshopTemplate()
