import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.your-server.de',
  port: 587,
  secure: false,
  auth: { user: 'info@bereifung24.de', pass: 'Milan06012016!' }
});

const BASE = 'https://bereifung24.de';

// === EMAIL 1: Kunden-Willkommen ===
const customerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .button { display: inline-block; padding: 15px 30px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
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
      <p><strong>Hallo Zdenek,</strong></p>
      <p>Vielen Dank für deine Registrierung bei Bereifung24! Wir freuen uns, dich auf unserer Plattform begrüßen zu dürfen.</p>
      <div class="features">
        <h3>Das bietet dir Bereifung24:</h3>
        <div class="feature">🔍 <strong>Reifen zum Festpreis</strong> – Transparente Preise, direkt online buchen</div>
        <div class="feature">🤖 <strong>KI-Reifenberater Rollo</strong> – Persönliche Empfehlungen für dein Fahrzeug</div>
        <div class="feature">📋 <strong>Fahrzeugschein-Scanner</strong> – Fahrzeugschein scannen und Fahrzeug automatisch anlegen</div>
        <div class="feature">🚗 <strong>Fahrzeugverwaltung</strong> – Fahrzeuge speichern und Reifenwechsel im Blick behalten</div>
        <div class="feature">📅 <strong>Direkte Terminbuchung</strong> – Werkstatt in deiner Nähe wählen und sofort buchen</div>
        <div class="feature">⭐ <strong>Bewertungen</strong> – Werkstatt-Bewertungen lesen und eigene schreiben</div>
      </div>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;"><strong>💡 Tipp:</strong> Vervollständige dein Profil mit deiner Adresse, damit wir dir Werkstätten in deiner Nähe anzeigen können!</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${BASE}" class="button">Jetzt Reifen finden</a>
      </div>
      <p>Bei Fragen stehen wir dir gerne zur Verfügung!</p>
      <p>Wir wünschen dir eine gute Fahrt! 🚗</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Deine Plattform für Reifenwechsel und mehr</p>
      <p style="margin-top: 10px;"><a href="${BASE}" style="color: #0ea5e9;">bereifung24.de</a></p>
    </div>
  </div>
</body>
</html>`;

// === EMAIL 2: Werkstatt-Registrierung ===
const workshopRegHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
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
      <p><strong>Hallo Zdenek Novak,</strong></p>
      <p>Herzlichen Glückwunsch! Ihre Werkstatt <strong>Test-Werkstatt GmbH</strong> wurde erfolgreich bei Bereifung24 registriert.</p>
      <div class="alert">
        <strong>Verifizierung erforderlich</strong><br>
        Ihr Account wird derzeit von unserem Team geprüft. Sie erhalten eine weitere E-Mail, sobald Ihr Account freigeschaltet wurde.
      </div>
      <div class="features">
        <h3>Nach der Freischaltung können Sie:</h3>
        <div class="feature">� <strong>Preiskalkulation</strong> – Eigene Festpreise für Reifenservices festlegen</div>
        <div class="feature">🔧 <strong>Services verwalten</strong> – Reifenwechsel, Einlagerung und weitere Dienstleistungen anbieten</div>
        <div class="feature">📅 <strong>Terminkalender</strong> – Ihren Kalender verbinden und Buchungen automatisch verwalten</div>
        <div class="feature">💳 <strong>Stripe-Anbindung</strong> – Schnelle und sichere Auszahlungen direkt auf Ihr Konto</div>
        <div class="feature">🚚 <strong>Lieferanten-Verbindung</strong> – Reifen direkt über verknüpfte Lieferanten beziehen</div>
        <div class="feature">🌐 <strong>Eigene Landing Page</strong> – Ihre Werkstatt professionell präsentieren und besser gefunden werden</div>
        <div class="feature">⭐ <strong>Bewertungen</strong> – Kundenbewertungen sammeln und mehr Umsatz generieren</div>
      </div>
      <p>Ihre Login-Daten:</p>
      <ul>
        <li><strong>E-Mail:</strong> zdenek156@gmail.com</li>
        <li><strong>Passwort:</strong> Das von Ihnen gewählte Passwort</li>
      </ul>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Partner-Plattform für Werkstätten</p>
      <p style="margin-top: 10px;"><a href="${BASE}" style="color: #0ea5e9;">bereifung24.de</a></p>
    </div>
  </div>
</body>
</html>`;

// === EMAIL 3: Werkstatt-Verifizierung ===
const workshopVerifiedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; padding: 15px 30px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .success { background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .feature:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ihr Account ist freigeschaltet! ✅</h1>
    </div>
    <div class="content">
      <p><strong>Hallo Zdenek Novak,</strong></p>
      <div class="success">
        <strong>Großartige Neuigkeiten!</strong><br>
        Ihre Werkstatt <strong>Test-Werkstatt GmbH</strong> wurde erfolgreich verifiziert und ist ab sofort auf Bereifung24 sichtbar!
      </div>
      <div class="features">
        <h3>Richten Sie jetzt Ihre Werkstatt ein:</h3>
        <div class="feature">💰 <strong>Preiskalkulation festlegen</strong> – Definieren Sie Ihre Festpreise für alle Reifenservices</div>
        <div class="feature">🔧 <strong>Services aktivieren</strong> – Reifenwechsel, Einlagerung und weitere Dienstleistungen freischalten</div>
        <div class="feature">📅 <strong>Terminkalender verbinden</strong> – Verknüpfen Sie Ihren Kalender für automatische Buchungsverwaltung</div>
        <div class="feature">💳 <strong>Stripe anbinden</strong> – Richten Sie Ihre schnelle und sichere Auszahlung ein</div>
        <div class="feature">🚚 <strong>Lieferant verbinden</strong> – Verknüpfen Sie Ihren Reifenlieferanten für direkte Bestellungen</div>
        <div class="feature">🌐 <strong>Landing Page gestalten</strong> – Präsentieren Sie Ihre Werkstatt professionell und werden Sie besser gefunden</div>
        <div class="feature">⭐ <strong>Bewertungen sammeln</strong> – Steigern Sie Ihre Sichtbarkeit und generieren Sie mehr Umsatz</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${BASE}/login" class="button">Zum Dashboard</a>
      </div>
      <p>Wir wünschen Ihnen viel Erfolg mit Bereifung24!</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Partner-Plattform für Werkstätten</p>
      <p style="margin-top: 10px;"><a href="${BASE}" style="color: #0ea5e9;">bereifung24.de</a></p>
    </div>
  </div>
</body>
</html>`;

const from = '"Bereifung24" <info@bereifung24.de>';
const to = 'zdenek156@gmail.com';

try {
  await transporter.sendMail({ from, to, subject: '1/3 Willkommen bei Bereifung24! (Test - Kunden-Registrierung)', html: customerHtml });
  console.log('✅ Email 1/3 gesendet: Kunden-Willkommen');

  await transporter.sendMail({ from, to, subject: '2/3 Willkommen bei Bereifung24! (Test - Werkstatt-Registrierung)', html: workshopRegHtml });
  console.log('✅ Email 2/3 gesendet: Werkstatt-Registrierung');

  await transporter.sendMail({ from, to, subject: '3/3 Account freigeschaltet! (Test - Werkstatt-Verifizierung)', html: workshopVerifiedHtml });
  console.log('✅ Email 3/3 gesendet: Werkstatt-Verifizierung');

  console.log('\n🎉 Alle 3 Test-Emails erfolgreich gesendet an ' + to);
} catch(e) {
  console.error('❌ Fehler:', e.message);
}
process.exit(0);
