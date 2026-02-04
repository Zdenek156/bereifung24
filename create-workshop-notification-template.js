const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTemplate() {
  try {
    const template = await prisma.emailTemplate.upsert({
      where: { key: 'direct_booking_workshop_notification' },
      update: {
        name: 'Direktbuchung - Werkstatt-Benachrichtigung',
        subject: 'Neue Direktbuchung - {{serviceType}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Direktbuchung</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🔔 Neue Direktbuchung
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                Hallo {{workshopName}},
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #333333;">
                Sie haben eine neue Direktbuchung über <strong>Bereifung24</strong> erhalten:
              </p>
              
              <!-- Booking Details Box -->
              <table style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; font-size: 18px; color: #667eea;">
                      📋 Buchungsdetails
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Buchungsnummer:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{bookingNumber}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Service:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{serviceType}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Termin:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{appointmentDate}}, {{appointmentTime}} Uhr
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Fahrzeug:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{vehicleBrand}} {{vehicleModel}} ({{licensePlate}})
                        </td>
                      </tr>
                      {{#if hasBalancing}}
                      <tr>
                        <td colspan="2" style="padding: 8px 0; font-size: 14px; color: #28a745;">
                          ✓ Mit Auswuchtung
                        </td>
                      </tr>
                      {{/if}}
                      {{#if hasStorage}}
                      <tr>
                        <td colspan="2" style="padding: 8px 0; font-size: 14px; color: #28a745;">
                          ✓ Mit Einlagerung
                        </td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 8px 0; font-size: 16px; color: #667eea;">
                          <strong>Gesamtbetrag:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 18px; color: #667eea; text-align: right; font-weight: bold;">
                          {{totalPrice}} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Customer Details Box -->
              <table style="width: 100%; border-collapse: collapse; background-color: #fff3cd; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; font-size: 18px; color: #856404;">
                      👤 Kundendaten
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Name:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{customerName}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>E-Mail:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          <a href="mailto:{{customerEmail}}" style="color: #667eea; text-decoration: none;">
                            {{customerEmail}}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Telefon:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          <a href="tel:{{customerPhone}}" style="color: #667eea; text-decoration: none;">
                            {{customerPhone}}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Important Notice -->
              <table style="width: 100%; border-collapse: collapse; background-color: #d1ecf1; border-left: 4px solid #0c5460; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #0c5460;">
                      <strong>ℹ️ Wichtig:</strong> Der Kunde hat bereits online bezahlt. Bitte bereiten Sie den Termin entsprechend vor.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="{{dashboardLink}}" style="display: inline-block; padding: 15px 40px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Zum Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; color: #666666; text-align: center;">
                Bei Fragen kontaktieren Sie bitte den Kunden direkt oder melden Sie sich bei unserem Support.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Diese E-Mail wurde automatisch von <strong>Bereifung24</strong> gesendet.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © 2026 Bereifung24. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        textContent: `Neue Direktbuchung

Hallo {{workshopName}},

Sie haben eine neue Direktbuchung über Bereifung24 erhalten:

BUCHUNGSDETAILS
Buchungsnummer: {{bookingNumber}}
Service: {{serviceType}}
Termin: {{appointmentDate}}, {{appointmentTime}} Uhr
Fahrzeug: {{vehicleBrand}} {{vehicleModel}} ({{licensePlate}})
Gesamtbetrag: {{totalPrice}} €

KUNDENDATEN
Name: {{customerName}}
E-Mail: {{customerEmail}}
Telefon: {{customerPhone}}

WICHTIG: Der Kunde hat bereits online bezahlt. Bitte bereiten Sie den Termin entsprechend vor.

Zum Dashboard: {{dashboardLink}}

Bei Fragen kontaktieren Sie bitte den Kunden direkt oder melden Sie sich bei unserem Support.

Diese E-Mail wurde automatisch von Bereifung24 gesendet.
© 2026 Bereifung24. Alle Rechte vorbehalten.`,
        category: 'BOOKING'
      },
      create: {
        key: 'direct_booking_workshop_notification',
        name: 'Direktbuchung - Werkstatt-Benachrichtigung',
        subject: 'Neue Direktbuchung - {{serviceType}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Direktbuchung</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🔔 Neue Direktbuchung
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                Hallo {{workshopName}},
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; color: #333333;">
                Sie haben eine neue Direktbuchung über <strong>Bereifung24</strong> erhalten:
              </p>
              
              <!-- Booking Details Box -->
              <table style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; font-size: 18px; color: #667eea;">
                      📋 Buchungsdetails
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Buchungsnummer:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{bookingNumber}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Service:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{serviceType}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Termin:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{appointmentDate}}, {{appointmentTime}} Uhr
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Fahrzeug:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{vehicleBrand}} {{vehicleModel}} ({{licensePlate}})
                        </td>
                      </tr>
                      {{#if hasBalancing}}
                      <tr>
                        <td colspan="2" style="padding: 8px 0; font-size: 14px; color: #28a745;">
                          ✓ Mit Auswuchtung
                        </td>
                      </tr>
                      {{/if}}
                      {{#if hasStorage}}
                      <tr>
                        <td colspan="2" style="padding: 8px 0; font-size: 14px; color: #28a745;">
                          ✓ Mit Einlagerung
                        </td>
                      </tr>
                      {{/if}}
                      <tr>
                        <td style="padding: 8px 0; font-size: 16px; color: #667eea;">
                          <strong>Gesamtbetrag:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 18px; color: #667eea; text-align: right; font-weight: bold;">
                          {{totalPrice}} €
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Customer Details Box -->
              <table style="width: 100%; border-collapse: collapse; background-color: #fff3cd; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px; font-size: 18px; color: #856404;">
                      👤 Kundendaten
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Name:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          {{customerName}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>E-Mail:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          <a href="mailto:{{customerEmail}}" style="color: #667eea; text-decoration: none;">
                            {{customerEmail}}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666;">
                          <strong>Telefon:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">
                          <a href="tel:{{customerPhone}}" style="color: #667eea; text-decoration: none;">
                            {{customerPhone}}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Important Notice -->
              <table style="width: 100%; border-collapse: collapse; background-color: #d1ecf1; border-left: 4px solid #0c5460; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 14px; color: #0c5460;">
                      <strong>ℹ️ Wichtig:</strong> Der Kunde hat bereits online bezahlt. Bitte bereiten Sie den Termin entsprechend vor.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="{{dashboardLink}}" style="display: inline-block; padding: 15px 40px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                      Zum Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; color: #666666; text-align: center;">
                Bei Fragen kontaktieren Sie bitte den Kunden direkt oder melden Sie sich bei unserem Support.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Diese E-Mail wurde automatisch von <strong>Bereifung24</strong> gesendet.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © 2026 Bereifung24. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        textContent: `Neue Direktbuchung

Hallo {{workshopName}},

Sie haben eine neue Direktbuchung über Bereifung24 erhalten:

BUCHUNGSDETAILS
Buchungsnummer: {{bookingNumber}}
Service: {{serviceType}}
Termin: {{appointmentDate}}, {{appointmentTime}} Uhr
Fahrzeug: {{vehicleBrand}} {{vehicleModel}} ({{licensePlate}})
Gesamtbetrag: {{totalPrice}} €

KUNDENDATEN
Name: {{customerName}}
E-Mail: {{customerEmail}}
Telefon: {{customerPhone}}

WICHTIG: Der Kunde hat bereits online bezahlt. Bitte bereiten Sie den Termin entsprechend vor.

Zum Dashboard: {{dashboardLink}}

Bei Fragen kontaktieren Sie bitte den Kunden direkt oder melden Sie sich bei unserem Support.

Diese E-Mail wurde automatisch von Bereifung24 gesendet.
© 2026 Bereifung24. Alle Rechte vorbehalten.`,
        category: 'BOOKING',
        isActive: true,
        placeholders: '["workshopName","customerName","customerEmail","customerPhone","bookingNumber","serviceType","appointmentDate","appointmentTime","vehicleBrand","vehicleModel","licensePlate","totalPrice","hasBalancing","hasStorage","dashboardLink"]'
      }
    })

    console.log('✅ Workshop notification template created/updated')
    console.log('Template ID:', template.id)
    console.log('Template Key:', template.key)
  } catch (error) {
    console.error('❌ Error creating template:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTemplate()
