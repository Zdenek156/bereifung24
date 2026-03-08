-- Insert WELCOME_FREELANCER email template
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_welcome_freelancer_001',
  'WELCOME_FREELANCER',
  'Willkommen - Freelancer',
  'Begrüßungs-E-Mail für neue Freelancer/Vertriebspartner mit Link zur Passwort-Erstellung',
  'Willkommen bei Bereifung24 – Dein Freelancer-Zugang',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; padding: 15px 30px; background: #06b6d4; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .info-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 0; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; border: 1px solid #e5e7eb; border-top: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Willkommen im Freelancer-Team!</h1>
      <p>Bereifung24 Vertriebspartner</p>
    </div>
    <div class="content">
      <p><strong>Hallo {{firstName}},</strong></p>
      <p>Herzlich willkommen als Vertriebspartner bei Bereifung24! Wir freuen uns auf die Zusammenarbeit.</p>

      <div class="info-box">
        <h3 style="margin-top:0;">Deine Zugangsdaten:</h3>
        <p><strong>E-Mail:</strong> {{email}}</p>
        <p><strong>Affiliate-Code:</strong> {{affiliateCode}}</p>
        <p><strong>Region:</strong> {{region}}</p>
        <p><strong>Tier:</strong> {{tier}}</p>
      </div>

      <p>Bitte erstelle jetzt dein Passwort, um auf dein Freelancer-Dashboard zuzugreifen:</p>
      <div style="text-align: center;">
        <a href="{{setupLink}}" class="button">Passwort erstellen &amp; loslegen</a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">Dieser Link ist 7 Tage g&uuml;ltig. Danach kannst du die &quot;Passwort vergessen&quot;-Funktion auf der Login-Seite nutzen.</p>

      <h3>Was dich erwartet:</h3>
      <ul>
        <li><strong>Dashboard:</strong> &Uuml;bersicht deiner Werkst&auml;tten, Provisionen und KPIs</li>
        <li><strong>Lead-Pipeline:</strong> Werkstatt-Leads verwalten und tracken</li>
        <li><strong>Provisionen:</strong> Transparente Abrechnung deiner Verdienste</li>
        <li><strong>Materialien:</strong> Verkaufsunterlagen und Pr&auml;sentationen</li>
      </ul>

      <p>Bei Fragen erreichst du uns jederzeit unter <a href="mailto:support@bereifung24.de">support@bereifung24.de</a>.</p>
      <p>Viel Erfolg!</p>
      <p><strong>Dein Bereifung24-Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24 GmbH</strong></p>
      <p>Deine Plattform f&uuml;r Reifenservice</p>
    </div>
  </div>
</body>
</html>',
  '[{"key": "firstName", "description": "Vorname des Freelancers"}, {"key": "lastName", "description": "Nachname des Freelancers"}, {"key": "email", "description": "E-Mail-Adresse"}, {"key": "affiliateCode", "description": "Persönlicher Affiliate-Code"}, {"key": "region", "description": "Zugewiesene Region"}, {"key": "tier", "description": "Tier-Level (Starter/Bronze/Silver/Gold)"}, {"key": "setupLink", "description": "Link zur Passwort-Erstellung"}]',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  "htmlContent" = EXCLUDED."htmlContent",
  placeholders = EXCLUDED.placeholders,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();
