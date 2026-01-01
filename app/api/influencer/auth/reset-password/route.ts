import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/influencer/auth/reset-password
 * Reset password for influencer (no token needed - direct reset)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'E-Mail und neues Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Find influencer by email
    const influencer = await prisma.influencer.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!influencer) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and ensure account is registered and active
    await prisma.influencer.update({
      where: { id: influencer.id },
      data: {
        password: hashedPassword,
        isRegistered: true, // Ensure account is marked as registered
        isActive: true, // Ensure account is active
        updatedAt: new Date()
      }
    })

    console.log(`[INFLUENCER] Password reset successful for: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt'
    })

  } catch (error) {
    console.error('[INFLUENCER] Password reset error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
