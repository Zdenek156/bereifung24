const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function insertEmailTemplate() {
  try {
    // Check if template already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: 'influencer-payment-confirmation' }
    })

    if (existing) {
      console.log('✅ Template already exists, updating...')
      await prisma.emailTemplate.update({
        where: { key: 'influencer-payment-confirmation' },
        data: {
          name: 'Influencer Auszahlungsbestätigung',
          description: 'E-Mail die an Influencer gesendet wird wenn eine Auszahlung als "Bezahlt" markiert wurde',
          subject: 'Ihre Auszahlung wurde durchgeführt - Bereifung24',
          htmlContent: getTemplateHtml(),
          placeholders: JSON.stringify([
            { key: 'influencerName', description: 'Name des Influencers' },
            { key: 'amount', description: 'Auszahlungsbetrag (z.B. €60.00)' },
            { key: 'periodStart', description: 'Startdatum des Abrechnungszeitraums' },
            { key: 'periodEnd', description: 'Enddatum des Abrechnungszeitraums' },
            { key: 'totalClicks', description: 'Anzahl der Klicks' },
            { key: 'clicksAmount', description: 'Betrag für Klicks' },
            { key: 'totalRegistrations', description: 'Anzahl der Registrierungen' },
            { key: 'registrationsAmount', description: 'Betrag für Registrierungen' },
            { key: 'totalOffers', description: 'Anzahl akzeptierter Angebote' },
            { key: 'offersAmount', description: 'Betrag für Angebote' },
            { key: 'paymentMethod', description: 'Zahlungsmethode (Banküberweisung/PayPal)' },
            { key: 'paymentReference', description: 'Transaktions-ID (optional)' },
            { key: 'paidAt', description: 'Datum der Auszahlung' }
          ]),
          isActive: true
        }
      })
      console.log('✅ Template updated successfully!')
    } else {
      console.log('Creating new template...')
      await prisma.emailTemplate.create({
        data: {
          key: 'influencer-payment-confirmation',
          name: 'Influencer Auszahlungsbestätigung',
          description: 'E-Mail die an Influencer gesendet wird wenn eine Auszahlung als "Bezahlt" markiert wurde',
          subject: 'Ihre Auszahlung wurde durchgeführt - Bereifung24',
          htmlContent: getTemplateHtml(),
          placeholders: JSON.stringify([
            { key: 'influencerName', description: 'Name des Influencers' },
            { key: 'amount', description: 'Auszahlungsbetrag (z.B. €60.00)' },
            { key: 'periodStart', description: 'Startdatum des Abrechnungszeitraums' },
            { key: 'periodEnd', description: 'Enddatum des Abrechnungszeitraums' },
            { key: 'totalClicks', description: 'Anzahl der Klicks' },
            { key: 'clicksAmount', description: 'Betrag für Klicks' },
            { key: 'totalRegistrations', description: 'Anzahl der Registrierungen' },
            { key: 'registrationsAmount', description: 'Betrag für Registrierungen' },
            { key: 'totalOffers', description: 'Anzahl akzeptierter Angebote' },
            { key: 'offersAmount', description: 'Betrag für Angebote' },
            { key: 'paymentMethod', description: 'Zahlungsmethode (Banküberweisung/PayPal)' },
            { key: 'paymentReference', description: 'Transaktions-ID (optional)' },
            { key: 'paidAt', description: 'Datum der Auszahlung' }
          ]),
          isActive: true
        }
      })
      console.log('✅ Template created successfully!')
    }

    console.log('\nVerfügbare Variablen:')
    console.log('- {{influencerName}} - Name des Influencers')
    console.log('- {{amount}} - Auszahlungsbetrag (z.B. €60.00)')
    console.log('- {{periodStart}} - Startdatum des Zeitraums')
    console.log('- {{periodEnd}} - Enddatum des Zeitraums')
    console.log('- {{totalClicks}} - Anzahl Klicks')
    console.log('- {{clicksAmount}} - Betrag für Klicks')
    console.log('- {{totalRegistrations}} - Anzahl Registrierungen')
    console.log('- {{registrationsAmount}} - Betrag für Registrierungen')
    console.log('- {{totalOffers}} - Anzahl Angebote')
    console.log('- {{offersAmount}} - Betrag für Angebote')
    console.log('- {{paymentMethod}} - Zahlungsmethode')
    console.log('- {{paymentReference}} - Transaktions-ID (optional)')
    console.log('- {{paidAt}} - Datum der Auszahlung')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getTemplateHtml() {
  return `<!DOCTYPE html>
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

      <p>Hallo {{influencerName}},</p>
      
      <p>
        großartige Neuigkeiten! Ihre Auszahlung wurde erfolgreich durchgeführt.
      </p>

      <div class="amount-box">
        <div class="label">Ausgezahlter Betrag</div>
        <div class="amount">{{amount}}</div>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Zeitraum</span>
          <span class="info-value">{{periodStart}} - {{periodEnd}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Zahlungsmethode</span>
          <span class="info-value">{{paymentMethod}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Transaktions-ID</span>
          <span class="info-value">{{paymentReference}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ausgezahlt am</span>
          <span class="info-value">{{paidAt}}</span>
        </div>
      </div>

      <h3 style="color: #111827; margin-top: 30px;">📊 Aufschlüsselung</h3>
      
      <div class="breakdown">
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-title">👆 Page Views (CPM)</span>
            <span class="breakdown-amount">{{clicksAmount}}</span>
          </div>
          <div class="breakdown-details">{{totalClicks}} Klicks</div>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-title">👤 Registrierungen</span>
            <span class="breakdown-amount">{{registrationsAmount}}</span>
          </div>
          <div class="breakdown-details">{{totalRegistrations}} Registrierungen</div>
        </div>
        
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span class="breakdown-title">✅ Akzeptierte Angebote</span>
            <span class="breakdown-amount">{{offersAmount}}</span>
          </div>
          <div class="breakdown-details">{{totalOffers}} Angebote</div>
        </div>
      </div>

      <p style="margin-top: 30px; background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
        <strong>💡 Tipp:</strong> Die Zahlung sollte in den nächsten 1-3 Werktagen auf Ihrem Konto eingehen.
      </p>

      <div class="button-container">
        <a href="https://www.bereifung24.de/influencer/payments" class="button">
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
</html>`
}

insertEmailTemplate()
