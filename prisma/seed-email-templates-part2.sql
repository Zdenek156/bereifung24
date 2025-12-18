-- Insert remaining email templates (Part 2)

-- 6. Booking Confirmation - Customer
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_booking_customer_006',
  'BOOKING_CONFIRMATION_CUSTOMER',
  'Terminbestätigung - Kunde',
  'Bestätigung des gebuchten Termins für den Kunden',
  'Terminbestätigung - {{workshopName}}',
  '<!DOCTYPE html>
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
</html>',
  '[{"key":"customerName","description":"Name des Kunden"},{"key":"appointmentDate","description":"Datum des Termins"},{"key":"appointmentTime","description":"Uhrzeit des Termins"},{"key":"workshopName","description":"Name der Werkstatt"},{"key":"workshopAddress","description":"Adresse der Werkstatt"},{"key":"workshopPhone","description":"Telefonnummer der Werkstatt"},{"key":"serviceName","description":"Art der Dienstleistung"},{"key":"price","description":"Preis der Dienstleistung"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 7. Booking Confirmation - Workshop
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_booking_workshop_007',
  'BOOKING_CONFIRMATION_WORKSHOP',
  'Terminbestätigung - Werkstatt',
  'Benachrichtigung an Werkstatt über neue Buchung',
  'Neue Buchung: {{customerName}} - {{serviceName}}',
  '<!DOCTYPE html>
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
</html>',
  '[{"key":"appointmentDate","description":"Datum des Termins"},{"key":"appointmentTime","description":"Uhrzeit des Termins"},{"key":"serviceName","description":"Art der Dienstleistung"},{"key":"customerName","description":"Name des Kunden"},{"key":"customerPhone","description":"Telefonnummer des Kunden"},{"key":"customerEmail","description":"E-Mail des Kunden"},{"key":"customerAddress","description":"Adresse des Kunden"},{"key":"vehicleInfo","description":"Fahrzeuginformationen"},{"key":"price","description":"Preis der Dienstleistung"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 8. Admin - New Customer Registration
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_admin_customer_reg_008',
  'ADMIN_CUSTOMER_REGISTRATION',
  'Admin: Neue Kundenregistrierung',
  'Benachrichtigung an Admin bei neuer Kundenregistrierung',
  '[Bereifung24] Neue Kundenregistrierung',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
    .content { background: white; padding: 20px; }
    .info-box { background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🆕 Neue Kundenregistrierung</h2>
    </div>
    <div class="content">
      <p>Ein neuer Kunde hat sich registriert:</p>
      <div class="info-box">
        <p><strong>Name:</strong> {{firstName}} {{lastName}}</p>
        <p><strong>E-Mail:</strong> {{email}}</p>
        <p><strong>Registriert am:</strong> {{registrationDate}}</p>
      </div>
    </div>
  </div>
</body>
</html>',
  '[{"key":"firstName","description":"Vorname"},{"key":"lastName","description":"Nachname"},{"key":"email","description":"E-Mail-Adresse"},{"key":"registrationDate","description":"Registrierungsdatum"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 9. Admin - New Workshop Registration
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_admin_workshop_reg_009',
  'ADMIN_WORKSHOP_REGISTRATION',
  'Admin: Neue Werkstattregistrierung',
  'Benachrichtigung an Admin bei neuer Werkstattregistrierung (Freischaltung erforderlich)',
  '[Bereifung24] Neue Werkstatt-Registrierung - Freischaltung erforderlich',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { background: white; padding: 20px; }
    .info-box { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ Neue Werkstatt-Registrierung</h2>
    </div>
    <div class="content">
      <div class="info-box">
        <p style="margin: 0;"><strong>Aktion erforderlich:</strong> Eine neue Werkstatt wartet auf Freischaltung!</p>
      </div>
      
      <p><strong>Werkstattdaten:</strong></p>
      <div class="info-box" style="background: #f3f4f6; border: none;">
        <p><strong>Firmenname:</strong> {{companyName}}</p>
        <p><strong>Ansprechpartner:</strong> {{firstName}} {{lastName}}</p>
        <p><strong>E-Mail:</strong> {{email}}</p>
        <p><strong>Telefon:</strong> {{phone}}</p>
        <p><strong>Adresse:</strong> {{address}}</p>
        <p><strong>Registriert am:</strong> {{registrationDate}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{adminUrl}}" class="button">Werkstatt prüfen und freischalten</a>
      </div>
    </div>
  </div>
</body>
</html>',
  '[{"key":"companyName","description":"Firmenname der Werkstatt"},{"key":"firstName","description":"Vorname Ansprechpartner"},{"key":"lastName","description":"Nachname Ansprechpartner"},{"key":"email","description":"E-Mail-Adresse"},{"key":"phone","description":"Telefonnummer"},{"key":"address","description":"Vollständige Adresse"},{"key":"registrationDate","description":"Registrierungsdatum"},{"key":"adminUrl","description":"URL zum Admin-Bereich"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- 10. SEPA Mandate Activated
INSERT INTO email_templates (id, key, name, description, subject, "htmlContent", placeholders, "isActive", "createdAt", "updatedAt")
VALUES (
  'tpl_sepa_activated_010',
  'SEPA_MANDATE_ACTIVATED',
  'SEPA-Mandat aktiviert',
  'Bestätigung an Werkstatt nach Aktivierung des SEPA-Mandats',
  'Ihr SEPA-Lastschriftmandat wurde aktiviert',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ SEPA-Mandat aktiv!</h1>
    </div>
    <div class="content">
      <p><strong>Hallo {{workshopName}},</strong></p>
      
      <div class="success-box">
        <p style="margin: 0;"><strong>Ihr SEPA-Lastschriftmandat wurde erfolgreich aktiviert!</strong></p>
      </div>

      <p>Ab sofort werden Ihre monatlichen Provisionen automatisch per SEPA-Lastschrift von Ihrem Konto eingezogen.</p>

      <div class="info-box">
        <p><strong>Mandatsreferenz:</strong> {{mandateReference}}</p>
        <p><strong>Kontoinhaber:</strong> {{accountHolder}}</p>
        <p><strong>IBAN:</strong> {{iban}}</p>
      </div>

      <p>Die Abbuchung erfolgt jeweils am 5. des Folgemonats für die Provisionen des Vormonats.</p>
      <p>Sie erhalten vor jeder Abbuchung eine Benachrichtigung per E-Mail.</p>

      <p style="margin-top: 30px;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24</strong></p>
      <p>Ihre Partner-Plattform für Reifenservice</p>
    </div>
  </div>
</body>
</html>',
  '[{"key":"workshopName","description":"Name der Werkstatt"},{"key":"mandateReference","description":"SEPA-Mandatsreferenz"},{"key":"accountHolder","description":"Name des Kontoinhabers"},{"key":"iban","description":"IBAN (teilweise maskiert)"}]',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;
