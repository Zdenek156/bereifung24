-- Email Template für Steuerberater-Dokumente
INSERT INTO email_templates (
  id,
  key,
  name,
  description,
  subject,
  html_content,
  placeholders,
  is_active,
  created_at,
  updated_at
) VALUES (
  'accountant_docs_' || substring(md5(random()::text) from 1 for 20),
  'ACCOUNTANT_DOCUMENTS',
  'Dokumente an Steuerberater',
  'Template für den Versand von Jahresabschluss-Dokumenten (Bilanz, GuV, Journal) an den Steuerberater',
  'Jahresabschluss {{year}} - Bereifung24 GmbH',
  '<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .document-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .document-item { padding: 10px 0; border-bottom: 1px solid #e9ecef; }
        .document-item:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Jahresabschluss {{year}}</h1>
            <p>Bereifung24 GmbH</p>
        </div>
        
        <div class="content">
            <p>Sehr geehrte Damen und Herren,</p>
            
            <p>anbei erhalten Sie die gewünschten Dokumente für das Geschäftsjahr <strong>{{year}}</strong>:</p>
            
            <div class="document-list">
                <h3>📎 Angehängte Dokumente:</h3>
                {{#each documents}}
                <div class="document-item">
                    <strong>{{this}}</strong>
                </div>
                {{/each}}
            </div>
            
            {{#if message}}
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>💬 Zusätzliche Information:</h3>
                <p style="white-space: pre-wrap;">{{message}}</p>
            </div>
            {{/if}}
            
            <p>Alle Dokumente wurden im Format <strong>{{format}}</strong> erstellt.</p>
            
            <p>Bei Fragen oder Unklarheiten stehen wir Ihnen gerne zur Verfügung.</p>
            
            <div class="footer">
                <p><strong>Mit freundlichen Grüßen</strong><br>
                {{sender}}<br>
                Bereifung24 GmbH</p>
                
                <p style="margin-top: 20px; font-size: 12px;">
                    Diese E-Mail wurde automatisch generiert.<br>
                    Bereifung24 GmbH | www.bereifung24.de
                </p>
            </div>
        </div>
    </div>
</body>
</html>',
  '{"year":"Geschäftsjahr","sender":"Absender Name","format":"Dokumentformat (PDF/Excel/CSV)","documents":"Array von Dokumentnamen","message":"Optionale Nachricht","accountantName":"Name des Steuerberaters"}',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  placeholders = EXCLUDED.placeholders,
  updated_at = CURRENT_TIMESTAMP;
