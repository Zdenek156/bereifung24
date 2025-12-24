import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testEmail, subject, message } = await request.json()

    if (!testEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    // Send test email
    await sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .test-banner { background: #fef3c7; border: 2px solid #f59e0b; color: #92400e; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px; font-weight: bold; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .message { white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            .unsubscribe { margin-top: 20px; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-banner">
              ⚠️ DIES IST EINE TEST-E-MAIL ⚠️
            </div>
            <div class="header">
              <h1>Bereifung24</h1>
            </div>
            <div class="content">
              <p>Hallo Test-Empfänger,</p>
              <div class="message">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.</p>
              <div class="unsubscribe">
                <p>Sie erhalten diese E-Mail, weil Sie bei Bereifung24 registriert sind.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Test-E-Mail erfolgreich versendet'
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Fehler beim Senden der Test-E-Mail' },
      { status: 500 }
    )
  }
}
