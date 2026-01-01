import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/influencer/auth/reset-password
 * Step 1: Request password reset - sends email with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      )
    }

    // Find influencer by email
    const influencer = await prisma.influencer.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    // Always return success to prevent email enumeration
    if (!influencer) {
      console.log(`[INFLUENCER] Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde eine E-Mail mit einem Reset-Link gesendet.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to database
    await prisma.influencer.update({
      where: { id: influencer.id },
      data: {
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date()
      }
    })

    // Send email with reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/influencer/reset-password?token=${resetToken}`
    
    try {
      await sendEmail({
        to: influencer.email,
        subject: 'Passwort zurücksetzen - Bereifung24 Influencer',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Passwort zurücksetzen</h2>
            <p>Hallo${influencer.name ? ' ' + influencer.name : ''},</p>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
            <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Passwort zurücksetzen
            </a>
            <p style="color: #666; font-size: 14px;">Dieser Link ist 1 Stunde gültig.</p>
            <p style="color: #666; font-size: 14px;">Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail einfach.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px;">
              Bereifung24 Influencer Portal<br>
              <a href="mailto:support@bereifung24.de">support@bereifung24.de</a>
            </p>
          </div>
        `
      })
      
      console.log(`[INFLUENCER] Password reset email sent to: ${email}`)
    } catch (emailError) {
      console.error('[INFLUENCER] Failed to send reset email:', emailError)
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Falls ein Account mit dieser E-Mail existiert, wurde eine E-Mail mit einem Reset-Link gesendet.'
    })

  } catch (error) {
    console.error('[INFLUENCER] Password reset request error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
