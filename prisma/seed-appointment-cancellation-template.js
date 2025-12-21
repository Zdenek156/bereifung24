const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding appointment cancellation email template...')

  const template = await prisma.emailTemplate.upsert({
    where: { key: 'appointment_cancelled' },
    update: {
      name: 'Terminabsage durch Werkstatt',
      description: 'Email an Kunden wenn Werkstatt einen Termin storniert',
      subject: 'Termin storniert - {{workshopName}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Terminabsage</h2>
          <p>Sehr geehrte/r {{customerFirstName}} {{customerLastName}},</p>
          
          <p>leider muss Ihr Termin bei <strong>{{workshopName}}</strong> storniert werden.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Termin:</strong> {{appointmentDate}}, {{appointmentTime}} Uhr</p>
            <p style="margin: 5px 0;"><strong>Grund:</strong> {{reasonLabel}}</p>
            {{additionalMessageBlock}}
          </div>

          {{rescheduleMessage}}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p><strong>{{workshopName}}</strong></p>
            {{workshopContactInfo}}
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            Mit freundlichen Grüßen<br/>
            Ihr Bereifung24 Team
          </p>
        </div>
      `,
      placeholders: JSON.stringify([
        { key: 'customerFirstName', description: 'Vorname des Kunden' },
        { key: 'customerLastName', description: 'Nachname des Kunden' },
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'appointmentDate', description: 'Terminatum' },
        { key: 'appointmentTime', description: 'Terminuhrzeit' },
        { key: 'reasonLabel', description: 'Stornierungsgrund (übersetzt)' },
        { key: 'additionalMessageBlock', description: 'HTML-Block mit zusätzlicher Nachricht (leer wenn keine)' },
        { key: 'rescheduleMessage', description: 'Nachricht über Neuterminierung' },
        { key: 'workshopContactInfo', description: 'Kontaktinformationen der Werkstatt' }
      ]),
      isActive: true
    },
    create: {
      key: 'appointment_cancelled',
      name: 'Terminabsage durch Werkstatt',
      description: 'Email an Kunden wenn Werkstatt einen Termin storniert',
      subject: 'Termin storniert - {{workshopName}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Terminabsage</h2>
          <p>Sehr geehrte/r {{customerFirstName}} {{customerLastName}},</p>
          
          <p>leider muss Ihr Termin bei <strong>{{workshopName}}</strong> storniert werden.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Termin:</strong> {{appointmentDate}}, {{appointmentTime}} Uhr</p>
            <p style="margin: 5px 0;"><strong>Grund:</strong> {{reasonLabel}}</p>
            {{additionalMessageBlock}}
          </div>

          {{rescheduleMessage}}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p><strong>{{workshopName}}</strong></p>
            {{workshopContactInfo}}
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            Mit freundlichen Grüßen<br/>
            Ihr Bereifung24 Team
          </p>
        </div>
      `,
      placeholders: JSON.stringify([
        { key: 'customerFirstName', description: 'Vorname des Kunden' },
        { key: 'customerLastName', description: 'Nachname des Kunden' },
        { key: 'workshopName', description: 'Name der Werkstatt' },
        { key: 'appointmentDate', description: 'Terminatum' },
        { key: 'appointmentTime', description: 'Terminuhrzeit' },
        { key: 'reasonLabel', description: 'Stornierungsgrund (übersetzt)' },
        { key: 'additionalMessageBlock', description: 'HTML-Block mit zusätzlicher Nachricht (leer wenn keine)' },
        { key: 'rescheduleMessage', description: 'Nachricht über Neuterminierung' },
        { key: 'workshopContactInfo', description: 'Kontaktinformationen der Werkstatt' }
      ]),
      isActive: true
    }
  })

  console.log('✅ Template created/updated:', template.name)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding template:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
