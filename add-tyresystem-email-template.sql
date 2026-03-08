-- Seed TyreSystem API-Zugangsdaten Email Template
-- Run on server: sudo -u postgres psql bereifung24 < add-tyresystem-email-template.sql

INSERT INTO supplier_email_templates (id, supplier_id, name, subject, body_html, description, is_active, created_at, updated_at)
VALUES (
  'tmpl-tyresystem-api-zugangsdaten',
  '69dc5e05-5d29-4f4c-a54c-ddd7dcc2bd16',
  'API-Zugangsdaten anfordern',
  'API-Zugangsdaten Anfrage – Kundennr. {supplier_customer_number} (Bereifung24)',
  '<p>Sehr geehrte Damen und Herren,</p>

<p>über unsere Plattform <strong>Bereifung24</strong> (www.bereifung24.de) hat die folgende Werkstatt die Anbindung an Ihren Reifengroßhandel beantragt und benötigt hierfür die REST-API-Zugangsdaten:</p>

<table class="credentials">
  <tr>
    <td>Werkstatt</td>
    <td><strong>{workshop_name}</strong></td>
  </tr>
  <tr>
    <td>Kundennummer bei TyreSystem</td>
    <td><strong>{supplier_customer_number}</strong></td>
  </tr>
  <tr>
    <td>Werkstatt-Ort</td>
    <td>{workshop_zipcode} {workshop_city}</td>
  </tr>
  <tr>
    <td>Ansprechpartner Werkstatt</td>
    <td>{workshop_contact_person}</td>
  </tr>
  <tr>
    <td>Werkstatt-E-Mail</td>
    <td><a href="mailto:{workshop_email}">{workshop_email}</a></td>
  </tr>
</table>

<div class="info-box">
  <h3>📡 Benötigte API-Konfiguration</h3>
  <p>Die Werkstatt wird über unsere Plattform folgende Schnittstelle nutzen:</p>
  <ul>
    <li><strong>Authentifizierung:</strong> REST API mit HTTP Basic Auth</li>
    <li><strong>Format:</strong> JSON Request/Response</li>
    <li><strong>Endpoints:</strong></li>
  </ul>
  <code class="endpoint">POST /Rest/Inquiry</code>
  <p style="margin: 2px 0 8px 12px; font-size: 12px; color: #666;">→ Artikelabfrage (Verfügbarkeit &amp; Preise)</p>
  <code class="endpoint">POST /Rest/Order</code>
  <p style="margin: 2px 0 0 12px; font-size: 12px; color: #666;">→ Bestellung aufgeben</p>
</div>

<p>Bitte senden Sie die Zugangsdaten (Benutzername und Passwort) an die bei Ihnen für die Kundennummer <strong>{supplier_customer_number}</strong> hinterlegte E-Mail-Adresse.</p>

<div class="warning">
  ⚠️ <strong>Hinweis:</strong> Die Zugangsdaten können wie gewohnt über Ihren einmalig abrufbaren Sicherheitslink an die hinterlegte E-Mail-Adresse der Werkstatt versendet werden.
</div>

<p>Vielen Dank für Ihre Unterstützung!</p>

<p>Mit freundlichen Grüßen,<br><strong>Das Team von Bereifung24</strong><br>Bereifung24 – Lieferanten-Management<br><a href="https://www.bereifung24.de">www.bereifung24.de</a></p>',
  'Wird automatisch versendet wenn eine Werkstatt über Bereifung24 API-Zugangsdaten bei TyreSystem anfordert. Enthält Kundennummer, Werkstatt-Infos und technische API-Details.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify
SELECT id, name, subject, is_active FROM supplier_email_templates WHERE supplier_id = '69dc5e05-5d29-4f4c-a54c-ddd7dcc2bd16';
