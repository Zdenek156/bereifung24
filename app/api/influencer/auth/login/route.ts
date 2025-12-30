import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * POST /api/influencer/auth/login
 * Login for influencers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Find influencer by email
    const influencer = await prisma.influencer.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        code: true,
        name: true,
        password: true,
        isActive: true,
        isRegistered: true,
      }
    })

    if (!influencer) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail oder Passwort' },
        { status: 401 }
      )
    }

    // Check if registered and has password
    if (!influencer.isRegistered || !influencer.password) {
      return NextResponse.json(
        { error: 'Bitte vervollständigen Sie zuerst Ihre Registrierung' },
        { status: 401 }
      )
    }

    // Check if active
    if (!influencer.isActive) {
      return NextResponse.json(
        { error: 'Ihr Account ist deaktiviert. Bitte kontaktieren Sie den Support.' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, influencer.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail oder Passwort' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.influencer.update({
      where: { id: influencer.id },
      data: { lastLoginAt: new Date() }
    })

    // Create JWT token
    const token = sign(
      {
        influencerId: influencer.id,
        email: influencer.email,
        code: influencer.code,
        type: 'influencer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Return success with token
    const response = NextResponse.json({
      success: true,
      influencer: {
        id: influencer.id,
        email: influencer.email,
        code: influencer.code,
        name: influencer.name,
      }
    })

    // Set HTTP-only cookie
    response.cookies.set('influencer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('[INFLUENCER] Login error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
