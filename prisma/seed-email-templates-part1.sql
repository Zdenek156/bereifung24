-- Insert existing email templates into database
-- This script populates the email_templates table with all current hard-coded templates

-- 1. Welcome Customer Email
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_welcome_customer_001',
  'WELCOME_CUSTOMER',
  'Willkommen - Kunde',
  'Willkommens-Email für neue Kunden nach der Registrierung',
  'Willkommen bei Bereifung24!',
  '<!DOCTYPE html>
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
</html>',
  '[{"key":"firstName","description":"Vorname des Kunden"},{"key":"email","description":"E-Mail-Adresse des Kunden"},{"key":"loginUrl","description":"URL zur Login-Seite"},{"key":"baseUrl","description":"Basis-URL der Plattform"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 2. Customer Email Verification
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_customer_verify_002',
  'CUSTOMER_EMAIL_VERIFICATION',
  'E-Mail Verifizierung - Kunde',
  'E-Mail zur Bestätigung der E-Mail-Adresse neuer Kunden',
  'Bestätige deine E-Mail-Adresse',
  '<!DOCTYPE html>
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
      <p><strong>Hallo {{firstName}},</strong></p>
      <p>Vielen Dank für deine Registrierung bei Bereifung24!</p>
      <p>Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren und dich anmelden zu können.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" class="button">
          E-Mail-Adresse bestätigen
        </a>
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
</html>',
  '[{"key":"firstName","description":"Vorname des Kunden"},{"key":"verificationUrl","description":"URL zur Email-Verifizierung"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 3. Welcome Workshop Email
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_welcome_workshop_003',
  'WELCOME_WORKSHOP',
  'Willkommen - Werkstatt',
  'Willkommens-Email für neue Werkstätten nach der Registrierung (noch nicht verifiziert)',
  'Willkommen bei Bereifung24 - Verifizierung erforderlich',
  '<!DOCTYPE html>
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
        <div class="feature">Ihre Werkstatt-Informationen pflegen</div>
      </div>

      <p>Ihre Login-Daten:</p>
      <ul>
        <li><strong>E-Mail:</strong> {{email}}</li>
        <li><strong>Passwort:</strong> Das von Ihnen gewählte Passwort</li>
      </ul>

      <p>Bei Fragen können Sie uns jederzeit kontaktieren.</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Partner-Plattform für Reifenservice</p>
    </div>
  </div>
</body>
</html>',
  '[{"key":"lastName","description":"Nachname des Ansprechpartners"},{"key":"companyName","description":"Name der Werkstatt"},{"key":"email","description":"E-Mail-Adresse der Werkstatt"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 4. Workshop Verified Email
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_workshop_verified_004',
  'WORKSHOP_VERIFIED',
  'Werkstatt freigeschaltet',
  'Benachrichtigung an Werkstatt nach erfolgreicher Verifizierung',
  'Ihr Bereifung24-Account wurde freigeschaltet!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Herzlichen Glückwunsch!</h1>
    </div>
    <div class="content">
      <p><strong>Hallo {{firstName}} {{lastName}},</strong></p>
      
      <div class="success-box">
        <p style="margin: 0;"><strong>Ihr Account wurde freigeschaltet!</strong></p>
        <p style="margin: 10px 0 0 0;">Sie können jetzt die Plattform in vollem Umfang nutzen.</p>
      </div>

      <p>Ihre Werkstatt <strong>{{companyName}}</strong> ist jetzt auf Bereifung24 aktiv und kann Kundenanfragen empfangen.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" class="button">
          Zum Dashboard
        </a>
      </div>

      <p>Viel Erfolg auf unserer Plattform!</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Partner-Plattform für Reifenservice</p>
    </div>
  </div>
</body>
</html>',
  '[{"key":"firstName","description":"Vorname des Ansprechpartners"},{"key":"lastName","description":"Nachname des Ansprechpartners"},{"key":"companyName","description":"Name der Werkstatt"},{"key":"loginUrl","description":"URL zur Login-Seite"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 5. New Offer - Customer Notification
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_new_offer_customer_005',
  'NEW_OFFER_CUSTOMER',
  'Neues Angebot - Kunde',
  'Benachrichtigung an Kunden bei neuem Angebot von Werkstatt',
  'Neues Angebot für Ihre Anfrage',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .offer-box { background: #f0f4ff; border: 2px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .price { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 Neues Angebot!</h1>
    </div>
    <div class="content">
      <p><strong>Hallo {{customerName}},</strong></p>
      <p>Sie haben ein neues Angebot für Ihre Reifenwechsel-Anfrage erhalten!</p>

      <div class="offer-box">
        <h3 style="margin-top: 0;">{{workshopName}}</h3>
        <p><strong>Reifen:</strong> {{tireBrand}} {{tireModel}}</p>
        <p><strong>Größe:</strong> {{tireSize}}</p>
        <div class="price">{{price}} €</div>
        <p style="font-size: 14px; color: #666;">{{priceDetails}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{offerUrl}}" class="button">
          Angebot ansehen
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Sie können das Angebot in Ihrem Dashboard prüfen und bei Interesse annehmen.
      </p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Deine Plattform für Reifenwechsel und mehr</p>
    </div>
  </div>
</body>
</html>',
  '[{"key":"customerName","description":"Name des Kunden"},{"key":"workshopName","description":"Name der Werkstatt"},{"key":"tireBrand","description":"Reifenmarke"},{"key":"tireModel","description":"Reifenmodell"},{"key":"tireSize","description":"Reifengröße"},{"key":"price","description":"Preis des Angebots"},{"key":"priceDetails","description":"Zusätzliche Preisinformationen"},{"key":"offerUrl","description":"URL zum Angebot"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- Note: I'll create a separate script for the remaining templates to keep this manageable
-- You can run this script first, then I'll create part 2 with the remaining templates
