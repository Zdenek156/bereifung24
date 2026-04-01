import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { geocodeAddress } from '@/lib/geocoding'
import { issueTokenPair } from '@/lib/mobile-auth'
import { checkRegisterRateLimit, getClientIp } from '@/lib/auth-rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimit = checkRegisterRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Zu viele Registrierungsversuche. Bitte in ${rateLimit.retryAfterSeconds} Sekunden erneut versuchen.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    const { email, password, firstName, lastName, phone, street, zipCode, city } = await request.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Name, E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 8 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Geocode address if provided
    let latitude: number | null = null
    let longitude: number | null = null
    
    if (street && city) {
      try {
        const coords = await geocodeAddress(`${street}, ${zipCode} ${city}, Germany`)
        if (coords) {
          latitude = coords.lat
          longitude = coords.lng
        }
      } catch (error) {
        console.error('Geocoding error:', error)
      }
    }

    // Create user and customer in one transaction
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || '',
        street: street || '',
        zipCode: zipCode || '',
        city: city || '',
        latitude,
        longitude,
        role: 'CUSTOMER',
        emailVerified: new Date(), // Mobile registrations are auto-verified
        customer: {
          create: {}
        }
      },
      include: {
        customer: true,
        workshop: true,
      }
    })

    // Issue tokens (access + refresh)
    const tokens = await issueTokenPair(user)

    // Send welcome email asynchronously (don't block response)
    try {
      const { sendEmail, welcomeCustomerEmailTemplate } = await import('@/lib/email')
      await sendEmail({
        to: user.email,
        subject: 'Willkommen bei Bereifung24!',
        html: welcomeCustomerEmailTemplate({
          firstName: user.firstName,
          email: user.email,
        }),
      })
    } catch (emailError) {
      console.error('[MOBILE REGISTER] Welcome email failed:', emailError)
    }

    // Admin-Benachrichtigungen senden (Mobile-Registrierung)
    try {
      const { sendEmail: sendAdminEmail, adminCustomerRegistrationEmailTemplate } = await import('@/lib/email')
      // @ts-ignore
      const adminSettings = await prisma.adminNotificationSetting.findMany({
        where: { notifyCustomerRegistration: true }
      }).catch(() => [])

      if (adminSettings && adminSettings.length > 0) {
        const registrationDate = new Date().toLocaleDateString('de-DE', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        for (const admin of adminSettings) {
          await sendAdminEmail({
            to: admin.email,
            subject: 'Neue Kunden-Registrierung (App) - Bereifung24',
            html: adminCustomerRegistrationEmailTemplate({
              customerName: `${user.firstName} ${user.lastName}`,
              email: user.email,
              phone: user.phone || undefined,
              city: user.city || undefined,
              registrationDate
            })
          }).catch(err => console.error(`[MOBILE REGISTER] Admin notification failed for ${admin.email}:`, err))
        }
      }
    } catch (adminErr) {
      console.error('[MOBILE REGISTER] Admin notification failed:', adminErr)
    }

    return NextResponse.json(tokens, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registrierungsfehler' },
      { status: 500 }
    )
  }
}
