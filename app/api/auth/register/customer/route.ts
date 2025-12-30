import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import crypto from 'crypto'
import { geocodeAddress } from '@/lib/geocoding'
import { sendEmail, customerVerificationEmailTemplate, adminCustomerRegistrationEmailTemplate } from '@/lib/email'

const customerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Passwort muss mindestens ein Sonderzeichen enthalten'),
  firstName: z.string().min(2, 'Vorname erforderlich'),
  lastName: z.string().min(2, 'Nachname erforderlich'),
  phone: z.string().optional(),
  street: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung
    const validatedData = customerSchema.parse(body)

    // Get affiliate ref from cookies (if exists)
    const affiliateRef = request.cookies.get('b24_affiliate_ref')?.value

    // Prüfen ob Email bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse bereits registriert' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Generiere Verifikations-Token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Geocode address if provided
    let latitude: number | null = null
    let longitude: number | null = null

    if (validatedData.street && validatedData.zipCode && validatedData.city) {
      const geocodeResult = await geocodeAddress(
        validatedData.street,
        validatedData.zipCode,
        validatedData.city
      )
      
      if (geocodeResult) {
        latitude = geocodeResult.latitude
        longitude = geocodeResult.longitude
      }
    }

    // User und Customer erstellen
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        street: validatedData.street,
        zipCode: validatedData.zipCode,
        city: validatedData.city,
        latitude: latitude,
        longitude: longitude,
        role: 'CUSTOMER',
        verificationToken: verificationToken,
        emailVerified: null,
        customer: {
          create: {}
        }
      },
      include: {
        customer: true
      }
    })

    // Bestätigungs-E-Mail senden
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Bestätige deine E-Mail-Adresse',
        html: customerVerificationEmailTemplate({
          firstName: user.firstName,
          verificationUrl: verificationUrl
        })
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Fehler beim E-Mail-Versand nicht nach außen weitergeben
    }

    // Admin-Benachrichtigungen senden
    try {
      // @ts-ignore - Prisma types need regeneration after schema change
      const adminSettings = await prisma.adminNotificationSetting.findMany({
        where: {
          notifyCustomerRegistration: true
        }
      }).catch(() => {
        console.log('Admin notification settings table not found - skipping admin notifications')
        return [] // Return empty array if table doesn't exist
      })

      if (adminSettings && adminSettings.length > 0) {
        const registrationDate = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })

        for (const admin of adminSettings) {
          await sendEmail({
            to: admin.email,
            subject: 'Neue Kunden-Registrierung - Bereifung24',
            html: adminCustomerRegistrationEmailTemplate({
              customerName: `${user.firstName} ${user.lastName}`,
              email: user.email,
              phone: user.phone || undefined,
              city: user.city || undefined,
              registrationDate: registrationDate
            })
          }).catch(err => console.error(`Failed to send admin notification to ${admin.email}:`, err))
        }
      }
    } catch (adminEmailError) {
      console.error('Failed to send admin notifications:', adminEmailError)
      // Fehler bei Admin-Benachrichtigungen nicht nach außen weitergeben
    }

    // Track affiliate conversion if ref code exists
    if (affiliateRef && user.customer) {
      try {
        const influencer = await prisma.influencer.findUnique({
          where: { code: affiliateRef }
        })

        if (influencer) {
          await prisma.affiliateConversion.create({
            data: {
              influencerId: influencer.id,
              customerId: user.customer.id,
              type: 'REGISTRATION',
              convertedAt: new Date(),
              isPaid: false
            }
          })
          
          console.log(`[AFFILIATE] Conversion tracked for ${affiliateRef} - Customer registration`)
        }
      } catch (conversionError) {
        console.error('[AFFILIATE] Error tracking conversion:', conversionError)
        // Don't fail registration if conversion tracking fails
      }
    }

    return NextResponse.json(
      { 
        message: 'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.',
        userId: user.id,
        emailSent: true
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Customer registration error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
