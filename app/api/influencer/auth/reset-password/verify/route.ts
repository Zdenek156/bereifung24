import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/influencer/auth/reset-password/verify
 * Step 2: Verify token and set new password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token und neues Passwort sind erforderlich' },
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

    // Find influencer by reset token
    const influencer = await prisma.influencer.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        }
      }
    })

    if (!influencer) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Reset-Link. Bitte fordern Sie einen neuen an.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    await prisma.influencer.update({
      where: { id: influencer.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        isRegistered: true, // Ensure account is marked as registered
        isActive: true, // Ensure account is active
        updatedAt: new Date()
      }
    })

    console.log(`[INFLUENCER] Password reset completed for: ${influencer.email}`)

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt'
    })

  } catch (error) {
    console.error('[INFLUENCER] Password reset verify error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
