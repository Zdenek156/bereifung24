import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST /api/influencer/auth/complete-registration
 * Complete influencer registration with token and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Find influencer by registration token
    const influencer = await prisma.influencer.findFirst({
      where: { 
        registrationToken: token,
        isRegistered: false
      }
    })

    if (!influencer) {
      return NextResponse.json(
        { error: 'Ungültiger oder bereits verwendeter Token' },
        { status: 404 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update influencer: set password, mark as registered, clear token
    await prisma.influencer.update({
      where: { id: influencer.id },
      data: {
        password: hashedPassword,
        isRegistered: true,
        registrationToken: null
      }
    })

    return NextResponse.json({
      message: 'Registrierung erfolgreich abgeschlossen! Sie können sich jetzt anmelden.',
      success: true
    })

  } catch (error) {
    console.error('[INFLUENCER] Complete registration error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
