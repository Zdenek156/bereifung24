-- Email template for commission invoices
-- Run this after migration to add the email template

INSERT INTO "email_templates" (
  "id",
  "slug",
  "name",
  "subject",
  "html_body",
  "plain_body",
  "category",
  "active",
  "created_at",
  "updated_at"
) VALUES (
  gen_random_uuid(),
  'commission-invoice',
  'Provisionsrechnung',
  'Provisionsabrechnung {{invoiceNumber}}',
  '
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .amount { font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Provisionsabrechnung</h1>
    </div>
    <div class="content">
      <p>Sehr geehrte Damen und Herren,</p>
      <p>anbei erhalten Sie Ihre Provisionsabrechnung <strong>{{invoiceNumber}}</strong> für den Zeitraum {{periodStart}} bis {{periodEnd}}.</p>
      
      <div class="amount">
        Rechnungsbetrag: {{totalAmount}}
      </div>
      
      {{#if sepaPaymentId}}
        <p style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745;">
          <strong>SEPA-Lastschrift:</strong><br>
          Der Betrag wird in den nächsten Tagen automatisch per SEPA-Lastschrift von Ihrem hinterlegten Konto eingezogen.
        </p>
      {{else}}
        <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
          <strong>Banküberweisung:</strong><br>
          Bitte überweisen Sie den Betrag bis zum {{dueDate}} auf unser Konto.<br>
          <strong>Verwendungszweck:</strong> {{invoiceNumber}}
        </p>
      {{/if}}
      
      <p>Die vollständige Rechnung finden Sie im Anhang als PDF-Dokument.</p>
      
      <p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
      
      <p>Mit freundlichen Grüßen<br>
      <strong>Ihr Bereifung24 Team</strong></p>
    </div>
    <div class="footer">
      <p>Bereifung24 GmbH | www.bereifung24.de</p>
      <p>Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
  ',
  '
Provisionsabrechnung {{invoiceNumber}}

Sehr geehrte Damen und Herren,

anbei erhalten Sie Ihre Provisionsabrechnung {{invoiceNumber}} für den Zeitraum {{periodStart}} bis {{periodEnd}}.

Rechnungsbetrag: {{totalAmount}}

{{#if sepaPaymentId}}
SEPA-Lastschrift:
Der Betrag wird in den nächsten Tagen automatisch per SEPA-Lastschrift von Ihrem hinterlegten Konto eingezogen.
{{else}}
Banküberweisung:
Bitte überweisen Sie den Betrag bis zum {{dueDate}} auf unser Konto.
Verwendungszweck: {{invoiceNumber}}
{{/if}}

Die vollständige Rechnung finden Sie im Anhang als PDF-Dokument.

Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Bereifung24 Team

---
Bereifung24 GmbH | www.bereifung24.de
Diese E-Mail wurde automatisch generiert.
  ',
  'SYSTEM',
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  "name" = EXCLUDED."name",
  "subject" = EXCLUDED."subject",
  "html_body" = EXCLUDED."html_body",
  "plain_body" = EXCLUDED."plain_body",
  "updated_at" = NOW();
