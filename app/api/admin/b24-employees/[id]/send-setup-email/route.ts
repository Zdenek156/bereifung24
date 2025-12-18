import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

// POST - Resend setup email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { id: params.id }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Generate new setup token
    const setupToken = randomBytes(32).toString('hex')
    const setupTokenExpiry = new Date()
    setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 24) // Token valid for 24 hours

    // Update employee with new token
    await prisma.b24Employee.update({
      where: { id: params.id },
      data: {
        setupToken,
        setupTokenExpiry
      }
    })

    // Send setup email
    const setupLink = `${process.env.NEXTAUTH_URL}/auth/employee/setup-password?token=${setupToken}`
    
    try {
      await sendEmail({
        to: employee.email,
        subject: 'Bereifung24 - Passwort festlegen',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Bereifung24</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Willkommen im Team!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hallo ${employee.firstName},
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Sie wurden als Mitarbeiter bei Bereifung24 angelegt. Um Zugang zum Admin-Bereich zu erhalten, 
                müssen Sie zunächst Ihr Passwort festlegen.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Klicken Sie auf den folgenden Button, um Ihr Passwort zu setzen:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupLink}" 
                   style="background-color: #2563eb; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold; 
                          display: inline-block;">
                  Passwort festlegen
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Oder kopieren Sie diesen Link in Ihren Browser:<br>
                <a href="${setupLink}" style="color: #2563eb;">${setupLink}</a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                <strong>Wichtig:</strong> Dieser Link ist nur 24 Stunden gültig.
              </p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                  Ihre Zugriffsrechte:<br>
                  Position: ${employee.position || 'Nicht angegeben'}<br>
                  Abteilung: ${employee.department || 'Nicht angegeben'}
                </p>
              </div>
            </div>
            
            <div style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.
              </p>
            </div>
          </div>
        `
      })

      return NextResponse.json({ 
        success: true,
        message: 'Setup-Email wurde versendet'
      })
    } catch (emailError) {
      console.error('Error sending setup email:', emailError)
      return NextResponse.json({ 
        error: 'Setup-Email konnte nicht versendet werden',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error resending setup email:', error)
    return NextResponse.json({ error: 'Failed to resend setup email' }, { status: 500 })
  }
}
