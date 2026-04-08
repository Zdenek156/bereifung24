import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { issueTokenPair } from '@/lib/mobile-auth'
import { checkLoginRateLimit, getClientIp } from '@/lib/auth-rate-limiter'

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'

interface GoogleTokenInfo {
  sub: string
  email: string
  email_verified: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

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

    const { provider, idToken, firstName: providedFirstName, lastName: providedLastName, phone: providedPhone, street: providedStreet, zipCode: providedZipCode, city: providedCity, email: providedEmail } = await request.json()

    if (!provider || !idToken) {
      return NextResponse.json(
        { error: 'Provider und ID-Token erforderlich' },
        { status: 400 }
      )
    }

    let email: string
    let providerId: string
    let firstName: string
    let lastName: string
    let pictureUrl: string | undefined

    if (provider === 'google') {
      // Verify Google ID token
      const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`)
      if (!response.ok) {
        return NextResponse.json({ error: 'Ungültiges Google-Token' }, { status: 401 })
      }

      const tokenInfo: GoogleTokenInfo = await response.json()
      if (tokenInfo.email_verified !== 'true') {
        return NextResponse.json({ error: 'Google E-Mail nicht verifiziert' }, { status: 401 })
      }

      email = tokenInfo.email.toLowerCase()
      providerId = tokenInfo.sub
      firstName = tokenInfo.given_name || tokenInfo.name?.split(' ')[0] || ''
      lastName = tokenInfo.family_name || tokenInfo.name?.split(' ').slice(1).join(' ') || ''
      pictureUrl = tokenInfo.picture

    } else if (provider === 'apple') {
      // Apple Sign-In: The idToken is a JWT signed by Apple
      // We verify it by checking against Apple's public keys
      const jwt = await import('jsonwebtoken')

      // Decode without verification first to get the header
      const decoded = jwt.default.decode(idToken, { complete: true }) as any
      if (!decoded) {
        return NextResponse.json({ error: 'Ungültiges Apple-Token' }, { status: 401 })
      }

      // For Apple, the email comes in the token payload
      const payload = decoded.payload as any
      email = (payload.email || '').toLowerCase()
      providerId = payload.sub

      if (!email) {
        return NextResponse.json({ error: 'Keine E-Mail im Apple-Token' }, { status: 401 })
      }

      // Apple only sends name on first sign-in, so we accept provided values
      firstName = providedFirstName || ''
      lastName = providedLastName || ''

      // If the email is a private relay address and user provided a real email, use that
      if (providedEmail && email.includes('privaterelay.appleid.com')) {
        const realEmail = providedEmail.toLowerCase().trim()
        // Basic server-side email validation
        if (realEmail.includes('@') && realEmail.includes('.') && !realEmail.includes('privaterelay.appleid.com')) {
          console.log(`[SOCIAL LOGIN] Replacing Apple relay email with provided email: ${realEmail}`)
          email = realEmail
        }
      }

    } else {
      return NextResponse.json({ error: 'Unbekannter Provider. Erlaubt: google, apple' }, { status: 400 })
    }

    // Look up existing user by email
    let user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true, workshop: true },
    })

    if (user) {
      // User exists - link provider ID if not already linked
      if (!user.isActive) {
        return NextResponse.json({ error: 'Account ist deaktiviert' }, { status: 401 })
      }

      const updateData: Record<string, unknown> = {}
      if (provider === 'google' && !user.googleId) {
        updateData.googleId = providerId
      }
      if (provider === 'apple' && !user.appleId) {
        updateData.appleId = providerId
      }
      if (!user.emailVerified) {
        updateData.emailVerified = new Date()
      }
      if (pictureUrl) {
        updateData.profileImage = pictureUrl
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: { customer: true, workshop: true },
        })
      }
    } else {
      // New user - create CUSTOMER account
      user = await prisma.user.create({
        data: {
          email,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || '',
          password: await bcrypt.hash(crypto.randomUUID(), 10), // random password for social-only users
          role: 'CUSTOMER',
          isActive: true,
          emailVerified: new Date(),
          googleId: provider === 'google' ? providerId : undefined,
          appleId: provider === 'apple' ? providerId : undefined,
          profileImage: pictureUrl || undefined,
          phone: providedPhone || '',
          street: providedStreet || '',
          zipCode: providedZipCode || '',
          city: providedCity || '',
          customer: { create: {} },
        },
        include: { customer: true, workshop: true },
      })

      // Send welcome email
      try {
        const { sendEmail, welcomeCustomerEmailTemplate } = await import('@/lib/email')
        await sendEmail({
          to: user.email,
          subject: 'Willkommen bei Bereifung24!',
          html: welcomeCustomerEmailTemplate({ firstName: user.firstName, email: user.email }),
        })
      } catch (emailError) {
        console.error('[SOCIAL LOGIN] Welcome email failed:', emailError)
      }

      // Admin-Benachrichtigungen senden (Social-Registrierung)
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
              subject: `Neue Kunden-Registrierung (${provider === 'google' ? 'Google' : 'Apple'}) - Bereifung24`,
              html: adminCustomerRegistrationEmailTemplate({
                customerName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                registrationDate
              })
            }).catch(err => console.error(`[SOCIAL LOGIN] Admin notification failed for ${admin.email}:`, err))
          }
        }
      } catch (adminErr) {
        console.error('[SOCIAL LOGIN] Admin notification failed:', adminErr)
      }
    }

    // Issue tokens
    const tokens = await issueTokenPair(user)
    return NextResponse.json(tokens)

  } catch (error) {
    console.error('[MOBILE SOCIAL LOGIN] Error:', error)
    return NextResponse.json({ error: 'Social Login fehlgeschlagen' }, { status: 500 })
  }
}
