const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding all email templates...')

  const templates = [
    // 1. WELCOME_CUSTOMER
    {
      id: 'tpl_welcome_customer_001',
      key: 'WELCOME_CUSTOMER',
      name: 'Willkommen - Kunde',
      description: 'Begrüßungs-E-Mail nach erfolgreicher Kunden-Registrierung',
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
        <a href="{{loginUrl}}" class="button">Jetzt anmelden</a>
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
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'firstName', description: 'Vorname des Kunden' },
        { key: 'email', description: 'E-Mail-Adresse des Kunden' },
        { key: 'loginUrl', description: 'URL zur Login-Seite' }
      ]),
      isActive: true
    },

    // 2. CUSTOMER_EMAIL_VERIFICATION
    {
      id: 'tpl_email_verify_002',
      key: 'CUSTOMER_EMAIL_VERIFICATION',
      name: 'E-Mail-Verifizierung - Kunde',
      description: 'E-Mail zur Bestätigung der E-Mail-Adresse',
      subject: 'Bestätige deine E-Mail-Adresse',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
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
      <p><strong>Hallo {{firstName}},</strong></p>
      <p>Vielen Dank für deine Registrierung bei Bereifung24!</p>
      <p>Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren und dich anmelden zu können.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" class="button">E-Mail-Adresse bestätigen</a>
      </div>

      <div class="info-box">
        <p style="margin: 0;"><strong>Hinweis:</strong> Dieser Link ist nur einmalig verwendbar. Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
      </div>

      <p>Alternativ kannst du auch folgenden Link in deinen Browser kopieren:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">{{verificationUrl}}</p>

      <p style="margin-top: 30px;">Bei Fragen stehen wir dir gerne zur Verfügung!</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Deine Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'firstName', description: 'Vorname des Kunden' },
        { key: 'verificationUrl', description: 'Verifizierungs-Link' }
      ]),
      isActive: true
    },

    // 3. WELCOME_WORKSHOP
    {
      id: 'tpl_welcome_workshop_003',
      key: 'WELCOME_WORKSHOP',
      name: 'Willkommen - Werkstatt',
      description: 'Begrüßungs-E-Mail nach Werkstatt-Registrierung',
      subject: 'Willkommen bei Bereifung24!',
      htmlContent: `<!DOCTYPE html>
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
      <p><strong>Hallo Herr {{lastName}},</strong></p>
      <p>Herzlichen Glückwunsch! Ihre Werkstatt <strong>{{companyName}}</strong> wurde erfolgreich bei Bereifung24 registriert.</p>
      
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
        <li><strong>E-Mail:</strong> {{email}}</li>
        <li><strong>Passwort:</strong> Das von Ihnen gewählte Passwort</li>
      </ul>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Partner-Plattform für Werkstätten</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'firstName', description: 'Vorname des Werkstatt-Inhabers' },
        { key: 'lastName', description: 'Nachname des Werkstatt-Inhabers' },
        { key: 'companyName', description: 'Name der Werkstatt/Firma' },
        { key: 'email', description: 'E-Mail-Adresse' }
      ]),
      isActive: true
    },

    // 4. WORKSHOP_VERIFIED
    {
      id: 'tpl_workshop_verified_004',
      key: 'WORKSHOP_VERIFIED',
      name: 'Werkstatt freigeschaltet',
      description: 'Benachrichtigung über erfolgreiche Verifizierung der Werkstatt',
      subject: 'Account freigeschaltet!',
      htmlContent: `<!DOCTYPE html>
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
      <p><strong>Hallo Herr {{lastName}},</strong></p>
      
      <div class="success">
        <strong>Großartige Neuigkeiten!</strong><br>
        Ihre Werkstatt <strong>{{companyName}}</strong> wurde erfolgreich verifiziert!
      </div>

      <p>Ab sofort können Sie Kundenanfragen empfangen und Angebote erstellen.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{dashboardUrl}}" class="button">Zum Dashboard</a>
      </div>

      <p>Viel Erfolg mit Bereifung24!</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'firstName', description: 'Vorname' },
        { key: 'lastName', description: 'Nachname' },
        { key: 'companyName', description: 'Firmenname' },
        { key: 'dashboardUrl', description: 'URL zum Dashboard' }
      ]),
      isActive: true
    },

    // 5. NEW_OFFER_CUSTOMER
    {
      id: 'tpl_new_offer_005',
      key: 'NEW_OFFER_CUSTOMER',
      name: 'Neues Angebot - Kunde',
      description: 'Benachrichtigung über ein neues Angebot für eine Reifenanfrage',
      subject: 'Neues Angebot für Ihre Anfrage - {{workshopName}}',
      htmlContent: `<!DOCTYPE html>
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
      <p>Hallo {{customerName}},</p>
      
      <p>Sie haben ein neues Angebot für Ihre Reifenanfrage erhalten!</p>
      
      <div class="offer-box">
        <h2 style="margin-top: 0; color: #1e40af;">Angebot von {{workshopName}}</h2>
        
        <p><strong>Dimension:</strong> {{tireSpecs}}</p>
        <p><strong>Reifen:</strong> {{tireBrand}} {{tireModel}}</p>
        
        <div class="price">{{price}} €</div>
        <p style="color: #6b7280; font-size: 14px;">inkl. Montage</p>
      </div>
      
      <p>Schauen Sie sich das vollständige Angebot in Ihrem Dashboard an und nehmen Sie es an, wenn es Ihnen zusagt.</p>
      
      <center>
        <a href="{{offerUrl}}" class="button">Angebot jetzt ansehen</a>
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
</html>`,
      placeholders: JSON.stringify([
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'tireSpecs', description: 'Reifengröße/Spezifikation' },
        { key: 'tireBrand', description: 'Reifenmarke' },
        { key: 'tireModel', description: 'Reifenmodell' },
        { key: 'price', description: 'Gesamtpreis' },
        { key: 'offerUrl', description: 'Link zum Angebot' }
      ]),
      isActive: true
    },

    // 6. BOOKING_CONFIRMATION_CUSTOMER (bereits vorhanden, aktualisiert)
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
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .appointment-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
    .detail-row:last-child { border-bottom: none; }
    .workshop-box { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .price-box { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
      <h1>Termin erfolgreich gebucht!</h1>
    </div>
    <div class="content">
      <p><strong>Hallo {{customerName}},</strong></p>
      
      <p>Vielen Dank für Ihre Buchung! Ihr Termin wurde erfolgreich bestätigt.</p>

      <div class="appointment-box">
        <h2 style="margin-top: 0; color: #059669;">📅 Ihr Termin</h2>
        <div class="detail-row">
          <span>Datum:</span>
          <span><strong>{{appointmentDate}}</strong></span>
        </div>
        <div class="detail-row">
          <span>Uhrzeit:</span>
          <span><strong>{{appointmentTime}} Uhr</strong></span>
        </div>
      </div>

      <div class="workshop-box">
        <h3 style="margin-top: 0; color: #667eea;">🏢 Werkstatt</h3>
        <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">{{workshopName}}</p>
        <p style="margin: 5px 0;">📍 {{workshopAddress}}</p>
        <p style="margin: 5px 0;">📞 {{workshopPhone}}</p>
      </div>

      <div class="price-box">
        <h2 style="margin: 0;">Gesamtpreis</h2>
        <div style="font-size: 36px; font-weight: bold; margin: 10px 0;">{{totalPrice}} €</div>
        <p style="margin: 0; opacity: 0.9;">inkl. Montage</p>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <strong>⏰ Wichtig:</strong> Bitte erscheinen Sie pünktlich zu Ihrem Termin.
      </p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'appointmentDate', description: 'Datum des Termins' },
        { key: 'appointmentTime', description: 'Uhrzeit des Termins' },
        { key: 'workshopAddress', description: 'Adresse der Werkstatt' },
        { key: 'workshopPhone', description: 'Telefonnummer der Werkstatt' },
        { key: 'totalPrice', description: 'Gesamtpreis' }
      ]),
      isActive: true
    },

    // 7. BOOKING_CONFIRMATION_WORKSHOP (bereits vorhanden, aktualisiert)
    {
      id: 'tpl_booking_workshop_007',
      key: 'BOOKING_CONFIRMATION_WORKSHOP',
      name: 'Terminbestätigung - Werkstatt',
      description: 'Benachrichtigung über neue Terminbuchung für Werkstatt',
      subject: 'Neue Terminbuchung - {{customerName}}',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .appointment-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .customer-box { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
    .detail-row:last-child { border-bottom: none; }
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
      <p><strong>Hallo {{workshopName}},</strong></p>
      
      <p>Sie haben eine neue Terminbuchung erhalten!</p>

      <div class="appointment-box">
        <h2 style="margin-top: 0; color: #3b82f6;">📅 Termin-Details</h2>
        <div class="detail-row">
          <span>Datum:</span>
          <span><strong>{{appointmentDate}}</strong></span>
        </div>
        <div class="detail-row">
          <span>Uhrzeit:</span>
          <span><strong>{{appointmentTime}} Uhr</strong></span>
        </div>
      </div>

      <div class="customer-box">
        <h3 style="margin-top: 0; color: #667eea;">👤 Kunde</h3>
        <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">{{customerName}}</p>
        <p style="margin: 5px 0;">📞 {{customerPhone}}</p>
        <p style="margin: 5px 0;">✉️ {{customerEmail}}</p>
      </div>

      <h3 style="color: #667eea;">🚗 Auftrags-Details</h3>
      <div class="detail-row">
        <span>Reifen:</span>
        <span><strong>{{tireBrand}} {{tireModel}}</strong></span>
      </div>
      <div class="detail-row">
        <span>Menge:</span>
        <span><strong>{{quantity}} Reifen</strong></span>
      </div>
      <div class="detail-row">
        <span>Gesamtpreis:</span>
        <span style="font-size: 18px; font-weight: bold; color: #059669;"><strong>{{totalPrice}} €</strong></span>
      </div>

      <p style="margin-top: 30px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <strong>📋 Nächste Schritte:</strong><br>
        - Reifen bestellen (falls noch nicht vorrätig)<br>
        - Termin wurde in Google Kalender eingetragen<br>
        - Bei Bedarf Kunde kontaktieren
      </p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'appointmentDate', description: 'Datum des Termins' },
        { key: 'appointmentTime', description: 'Uhrzeit des Termins' },
        { key: 'customerPhone', description: 'Telefonnummer des Kunden' },
        { key: 'customerEmail', description: 'E-Mail des Kunden' },
        { key: 'tireBrand', description: 'Reifenmarke' },
        { key: 'tireModel', description: 'Reifenmodell' },
        { key: 'quantity', description: 'Anzahl der Reifen' },
        { key: 'totalPrice', description: 'Gesamtpreis' }
      ]),
      isActive: true
    },

    // 8. OFFER_ACCEPTED
    {
      id: 'tpl_offer_accepted_008',
      key: 'OFFER_ACCEPTED',
      name: 'Angebot angenommen - Werkstatt',
      description: 'Benachrichtigung an Werkstatt, dass ein Angebot angenommen wurde',
      subject: 'Ihr Angebot wurde angenommen - {{customerName}}',
      htmlContent: `<!DOCTYPE html>
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
      <p>Hallo {{workshopName}},</p>
      
      <p>Großartige Neuigkeiten! Ein Kunde hat Ihr Angebot angenommen.</p>
      
      <div class="info-box">
        <h2 style="margin-top: 0; color: #059669;">Angebotsinformationen</h2>
        
        <p><strong>Reifen:</strong> {{tireBrand}} {{tireModel}}</p>
        <p><strong>Dimension:</strong> {{tireSpecs}}</p>
        
        <div class="highlight">{{price}} €</div>
        <p style="color: #6b7280; font-size: 14px;">inkl. Montage</p>
      </div>
      
      <div class="customer-info">
        <h3 style="margin-top: 0; color: #059669;">Kundenkontakt</h3>
        <p><strong>Name:</strong> {{customerName}}</p>
        <p><strong>E-Mail:</strong> {{customerEmail}}</p>
        <p><strong>Telefon:</strong> {{customerPhone}}</p>
      </div>
      
      <p><strong>Nächste Schritte:</strong></p>
      <ul>
        <li>Der Kunde wird nun einen Termin für die Montage buchen</li>
        <li>Sie erhalten eine weitere Benachrichtigung, sobald der Termin feststeht</li>
        <li>Bereiten Sie die bestellten Reifen vor</li>
      </ul>
    </div>
    <div class="footer">
      <p>Bereifung24 - Ihre Online-Plattform für Reifenservice</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'tireBrand', description: 'Reifenmarke' },
        { key: 'tireModel', description: 'Reifenmodell' },
        { key: 'tireSpecs', description: 'Reifengröße' },
        { key: 'price', description: 'Gesamtpreis' },
        { key: 'customerEmail', description: 'E-Mail des Kunden' },
        { key: 'customerPhone', description: 'Telefon des Kunden' }
      ]),
      isActive: true
    },

    // 9. ADMIN_CUSTOMER_REGISTRATION
    {
      id: 'tpl_admin_customer_reg_009',
      key: 'ADMIN_CUSTOMER_REGISTRATION',
      name: 'Admin: Kunden-Registrierung',
      description: 'Admin-Benachrichtigung über neue Kunden-Registrierung',
      subject: 'Neue Kunden-Registrierung - {{customerName}}',
      htmlContent: `<!DOCTYPE html>
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
        <p><strong>Name:</strong> {{customerName}}</p>
        <p><strong>E-Mail:</strong> {{email}}</p>
        <p><strong>Stadt:</strong> {{city}}</p>
        <p><strong>Registriert am:</strong> {{registrationDate}}</p>
      </div>
    </div>
    <div class="footer">
      <p>Bereifung24 - Admin-Benachrichtigung</p>
      <p>Diese E-Mail wurde automatisch generiert</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'customerName', description: 'Name des Kunden' },
        { key: 'email', description: 'E-Mail-Adresse' },
        { key: 'city', description: 'Stadt' },
        { key: 'registrationDate', description: 'Registrierungsdatum' }
      ]),
      isActive: true
    },

    // 10. ADMIN_WORKSHOP_REGISTRATION
    {
      id: 'tpl_admin_workshop_reg_010',
      key: 'ADMIN_WORKSHOP_REGISTRATION',
      name: 'Admin: Werkstatt-Registrierung',
      description: 'Admin-Benachrichtigung über neue Werkstatt-Registrierung',
      subject: 'Neue Werkstatt-Registrierung - {{companyName}}',
      htmlContent: `<!DOCTYPE html>
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
        <p><strong>Firma:</strong> {{companyName}}</p>
        <p><strong>Ansprechpartner:</strong> {{workshopName}}</p>
        <p><strong>E-Mail:</strong> {{email}}</p>
        <p><strong>Stadt:</strong> {{city}}</p>
        <p><strong>Registriert am:</strong> {{registrationDate}}</p>
      </div>
      
      <p><strong>Nächste Schritte:</strong></p>
      <ul>
        <li>Überprüfen Sie die Werkstatt-Daten</li>
        <li>Schalten Sie die Werkstatt frei, wenn alles korrekt ist</li>
        <li>Die Werkstatt erhält automatisch eine Benachrichtigung bei Freischaltung</li>
      </ul>
    </div>
    <div class="footer">
      <p>Bereifung24 - Admin-Benachrichtigung</p>
      <p>Diese E-Mail wurde automatisch generiert</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'companyName', description: 'Firmenname' },
        { key: 'workshopName', description: 'Name Ansprechpartner' },
        { key: 'email', description: 'E-Mail-Adresse' },
        { key: 'city', description: 'Stadt' },
        { key: 'registrationDate', description: 'Registrierungsdatum' }
      ]),
      isActive: true
    },

    // 11. NEW_TIRE_REQUEST
    {
      id: 'tpl_new_tire_request_011',
      key: 'NEW_TIRE_REQUEST',
      name: 'Neue Reifenanfrage - Werkstatt',
      description: 'Benachrichtigung an Werkstatt über neue Reifenanfrage in der Nähe',
      subject: 'Neue Reifenanfrage in Ihrer Nähe',
      htmlContent: `<!DOCTYPE html>
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
    .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
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
      <p><strong>Hallo {{workshopName}},</strong></p>
      
      <p>Es gibt eine neue Reifenanfrage in Ihrer Nähe!</p>
      
      <div class="highlight">
        <strong>📍 Entfernung:</strong> Ca. {{distance}} von Ihrem Standort<br>
        <strong>📅 Benötigt bis:</strong> {{needByDate}}
      </div>

      <div class="tire-details">
        <h2 style="margin-top: 0; color: #667eea;">Anfrage-Details</h2>
        
        <div class="detail-row">
          <strong>Saison:</strong> {{season}}
        </div>
        
        <div class="detail-row">
          <strong>Reifengröße:</strong> {{tireSize}}
        </div>
        
        <div class="detail-row">
          <strong>Menge:</strong> {{quantity}} Reifen
        </div>
      </div>

      <div class="urgency">
        <strong>⏰ Jetzt reagieren und Angebot erstellen!</strong><br>
        Je schneller Sie reagieren, desto höher sind Ihre Chancen, den Auftrag zu erhalten.
      </div>

      <center>
        <a href="{{requestUrl}}" class="button">Jetzt Angebot erstellen</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'distance', description: 'Entfernung zum Kunden' },
        { key: 'needByDate', description: 'Wunschtermin' },
        { key: 'season', description: 'Reifenart (Sommer/Winter/Ganzjahr)' },
        { key: 'tireSize', description: 'Reifengröße' },
        { key: 'quantity', description: 'Anzahl Reifen' },
        { key: 'requestUrl', description: 'Link zur Anfrage' }
      ]),
      isActive: true
    },

    // 12. SEPA_MANDATE_ACTIVATED
    {
      id: 'tpl_sepa_activated_012',
      key: 'SEPA_MANDATE_ACTIVATED',
      name: 'SEPA-Mandat aktiviert',
      description: 'Benachrichtigung über erfolgreiche SEPA-Mandatsaktivierung',
      subject: 'SEPA-Lastschriftmandat aktiviert',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .success-icon { text-align: center; font-size: 64px; margin: 20px 0; }
    .highlight { background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 20px 0; }
    .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; text-align: center; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 SEPA-Mandat aktiviert!</h1>
    </div>
    
    <div class="content">
      <div class="success-icon">✅</div>
      
      <p>Sehr geehrte Damen und Herren von <strong>{{companyName}}</strong>,</p>
      
      <div class="highlight">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">
          Ihr SEPA-Lastschriftmandat wurde erfolgreich aktiviert!
        </p>
      </div>
      
      <p>
        Sie können ab sofort Angebote auf Kundenanfragen erstellen.
      </p>

      <div class="info-box">
        <div class="info-row">
          <strong>Mandatsreferenz:</strong> {{mandateReference}}
        </div>
        <div class="info-row">
          <strong>Aktiviert am:</strong> {{activatedAt}}
        </div>
        <div class="info-row">
          <strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">✓ Aktiv</span>
        </div>
      </div>

      <h3 style="color: #667eea; margin-top: 30px;">Was bedeutet das für Sie?</h3>
      <ul>
        <li>Sie können jetzt auf alle Kundenanfragen mit Angeboten reagieren</li>
        <li>Ihre Provisionen werden monatlich per SEPA-Lastschrift eingezogen</li>
        <li>Keine manuelle Zahlung erforderlich - alles läuft automatisch</li>
      </ul>

      <center>
        <a href="{{dashboardUrl}}" class="button">Jetzt Anfragen durchsuchen</a>
      </center>

      <p>Viel Erfolg mit Bereifung24!<br>Ihr Bereifung24-Team</p>
    </div>
    
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>`,
      placeholders: JSON.stringify([
        { key: 'companyName', description: 'Firmenname' },
        { key: 'mandateReference', description: 'SEPA-Mandatsreferenz' },
        { key: 'activatedAt', description: 'Aktivierungsdatum' },
        { key: 'dashboardUrl', description: 'Link zum Dashboard' }
      ]),
      isActive: true
    }
  ]

  // Upsert all templates
  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: template.key },
      update: template,
      create: template
    })
    console.log(`✓ Template ${template.key} added/updated`)
  }

  console.log('\n✅ All email templates seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
