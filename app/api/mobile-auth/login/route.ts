import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { issueTokenPair } from '@/lib/mobile-auth'
import { checkLoginRateLimit, getClientIp } from '@/lib/auth-rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimit = checkLoginRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Zu viele Anmeldeversuche. Bitte in ${rateLimit.retryAfterSeconds} Sekunden erneut versuchen.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort erforderlich' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        customer: true,
        workshop: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Es existiert kein Konto mit dieser E-Mail-Adresse.' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account ist deaktiviert' },
        { status: 401 }
      )
    }

    // Check email verification for customers
    if (user.role === 'CUSTOMER' && !user.emailVerified) {
      return NextResponse.json(
        { error: 'Bitte bestätige zuerst deine E-Mail-Adresse.' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Das Passwort ist nicht korrekt.' },
        { status: 401 }
      )
    }

    // Issue access + refresh tokens
    const tokens = await issueTokenPair(user)

    return NextResponse.json(tokens)

  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { error: 'Anmeldefehler' },
      { status: 500 }
    )
  }
}
