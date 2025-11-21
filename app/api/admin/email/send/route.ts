import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientGroup, subject, message } = await request.json()

    if (!recipientGroup || !subject || !message) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Empfänger abrufen
    let recipients: { email: string; name: string }[] = []

    switch (recipientGroup) {
      case 'all_workshops':
        const workshops = await prisma.workshop.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = workshops.map(w => ({
          email: w.user.email,
          name: w.companyName
        }))
        break

      case 'all_customers':
        const customers = await prisma.customer.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = customers.map(c => ({
          email: c.user.email,
          name: `${c.user.firstName} ${c.user.lastName}`
        }))
        break

      case 'workshops_no_revenue':
        const workshopsNoRevenue = await prisma.workshop.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                }
              }
            }
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = workshopsNoRevenue
          .filter(w => w.bookings.length === 0)
          .map(w => ({
            email: w.user.email,
            name: w.companyName
          }))
        break

      case 'customers_no_requests':
        const customersNoRequests = await prisma.customer.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            tireRequests: true
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = customersNoRequests
          .filter(c => c.tireRequests.length === 0)
          .map(c => ({
            email: c.user.email,
            name: `${c.user.firstName} ${c.user.lastName}`
          }))
        break

      default:
        return NextResponse.json(
          { error: 'Ungültige Empfängergruppe' },
          { status: 400 }
        )
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'Keine Empfänger gefunden' },
        { status: 400 }
      )
    }

    // E-Mails im Hintergrund versenden
    const emailPromises = recipients.map(recipient =>
      sendEmail({
        to: recipient.email,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .message { white-space: pre-wrap; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
              .unsubscribe { margin-top: 20px; font-size: 11px; color: #9ca3af; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bereifung24</h1>
              </div>
              <div class="content">
                <p>Hallo ${recipient.name},</p>
                <div class="message">${message.replace(/\n/g, '<br>')}</div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.</p>
                <div class="unsubscribe">
                  <p>Sie erhalten diese E-Mail, weil Sie bei Bereifung24 registriert sind.</p>
                  <p>Bei Fragen kontaktieren Sie uns unter: info@bereifung24.de</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Hallo ${recipient.name},\n\n${message}\n\n---\n© ${new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.`
      }).catch(error => {
        console.error(`Failed to send email to ${recipient.email}:`, error)
        return null
      })
    )

    // Warte auf alle E-Mails (aber ignoriere Fehler)
    await Promise.allSettled(emailPromises)

    console.log(`Sent ${recipients.length} emails for group: ${recipientGroup}`)

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      message: `E-Mails wurden an ${recipients.length} Empfänger versendet`
    })

  } catch (error) {
    console.error('Error sending emails:', error)
    return NextResponse.json(
      { error: 'Fehler beim Versenden der E-Mails' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
