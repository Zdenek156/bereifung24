import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import { checkPasswordResetRateLimit, getClientIp } from '@/lib/auth-rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimit = checkPasswordResetRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Zu viele Anfragen. Bitte in ${rateLimit.retryAfterSeconds} Sekunden erneut versuchen.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse erforderlich' },
        { status: 400 }
      )
    }

    // Always return success for security (don't reveal if email exists)
    const successResponse = {
      success: true,
      message: 'Wenn ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.',
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(successResponse)
    }

    // Generate reset token (1 hour validity)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    })

    // Send reset email
    const baseUrl = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

    await sendEmail({
      to: email,
      subject: 'Bereifung24 - Passwort zurücksetzen',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Passwort zurücksetzen</h1>
            </div>
            <div class="content">
              <p>Hallo ${user.firstName},</p>
              <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
              <p>Klicken Sie auf den folgenden Button, um ein neues Passwort zu erstellen:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Neues Passwort erstellen</a>
              </div>
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Oder kopieren Sie diesen Link:<br>
                <span style="word-break: break-all;">${resetLink}</span>
              </p>
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Hinweis:</strong> Dieser Link ist 1 Stunde gültig.
              </p>
              <p>Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hallo ${user.firstName},\n\nSetzen Sie Ihr Passwort zurück: ${resetLink}\n\nDer Link ist 1 Stunde gültig.\n\nBereifung24`,
    })

    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('[MOBILE FORGOT-PASSWORD] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen des Passworts' },
      { status: 500 }
    )
  }
}
