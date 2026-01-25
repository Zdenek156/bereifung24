-- Add monthly invoice email template
INSERT INTO email_templates (
  id,
  key,
  name,
  description,
  subject,
  "htmlContent",
  placeholders,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'tpl_monthly_invoice_001',
  'MONTHLY_INVOICE_WORKSHOP',
  'Monatliche Provisionsrechnung - Werkstatt',
  'Monatliche Rechnung mit Provisionszusammenfassung für Werkstätten (wird am 1. des Folgemonats versendet)',
  'Ihre Provisionsrechnung {{invoiceNumber}} für {{periodMonth}}',
  '<!DOCTYPE html>
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
</html>',
  '[{"key":"workshopName","description":"Name der Werkstatt"},{"key":"invoiceNumber","description":"Rechnungsnummer (z.B. B24-INV-2025-0007)"},{"key":"invoiceDate","description":"Datum der Rechnungserstellung"},{"key":"periodMonth","description":"Monat der Abrechnung (z.B. \"Dezember 2025\")"},{"key":"periodStart","description":"Start des Leistungszeitraums (z.B. \"01.12.2025\")"},{"key":"periodEnd","description":"Ende des Leistungszeitraums (z.B. \"31.12.2025\")"},{"key":"commissionCount","description":"Anzahl der abgerechneten Aufträge"},{"key":"totalAmount","description":"Gesamtbetrag inkl. MwSt. (formatiert mit €)"},{"key":"sepaReference","description":"SEPA-Mandatsreferenz"},{"key":"commissionItems","description":"HTML-Liste mit Provisions-Positionen"},{"key":"invoiceUrl","description":"URL zum Download der PDF-Rechnung"}]',
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
