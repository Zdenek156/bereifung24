const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateAccountantTemplate() {
  try {
    // Check if template exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: 'ACCOUNTANT_DOCUMENTS' }
    })

    if (!existing) {
      console.log('❌ Template ACCOUNTANT_DOCUMENTS does not exist!')
      return
    }

    // Update the template with tax number
    await prisma.emailTemplate.update({
      where: { key: 'ACCOUNTANT_DOCUMENTS' },
      data: {
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; max-width: 600px; margin: 0 auto; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .document-list { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .document-item { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .document-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Jahresabschluss {{year}}</h1>
    <p>Bereifung24 GmbH</p>
  </div>
  
  <div class="content">
    <p>{{#if accountantName}}Sehr geehrte/r {{accountantName}}{{else}}Sehr geehrte Damen und Herren{{/if}},</p>
    
    <p>anbei erhalten Sie folgende Dokumente für das Geschäftsjahr {{year}}:</p>
    
    <div class="document-list">
      {{#each documents}}
      <div class="document-item">📄 {{this}}</div>
      {{/each}}
    </div>
    
    {{#if message}}
    <p><strong>Zusätzliche Information:</strong></p>
    <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
      {{message}}
    </p>
    {{/if}}
    
    <p>Alle Dokumente wurden im Format <strong>{{format}}</strong> bereitgestellt.</p>
    
    <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
    
    <p>Mit freundlichen Grüßen<br>
    {{senderName}}<br>
    <strong>Bereifung24 GmbH</strong></p>
  </div>
  
  <div class="footer">
    <p>Bereifung24 GmbH | Diese Email wurde automatisch generiert</p>
    <p>{{#if companyAddress}}{{companyAddress}}{{/if}}</p>
    {{#if companyTaxNumber}}<p><strong>Steuernummer:</strong> {{companyTaxNumber}}</p>{{/if}}
  </div>
</body>
</html>
        `.trim(),
        placeholders: JSON.stringify([
          'year',
          'accountantName',
          'documents',
          'message',
          'format',
          'senderName',
          'companyAddress',
          'companyTaxNumber'
        ])
      }
    })

    console.log('✅ Email template ACCOUNTANT_DOCUMENTS updated successfully with tax number!')
  } catch (error) {
    console.error('❌ Error updating template:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addAccountantTemplate().catch(console.error)
