import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/geocoding'
import { sendEmail, welcomeWorkshopEmailTemplate, adminWorkshopRegistrationEmailTemplate } from '@/lib/email'

const workshopSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Passwort muss mindestens ein Sonderzeichen enthalten'),
  firstName: z.string().min(2, 'Vorname erforderlich'),
  lastName: z.string().min(2, 'Nachname erforderlich'),
  phone: z.string().min(5, 'Telefonnummer erforderlich'),
  companyName: z.string().min(3, 'Firmenname erforderlich'),
  street: z.string().min(3, 'Straße erforderlich'),
  zipCode: z.string().min(5, 'PLZ erforderlich'),
  city: z.string().min(2, 'Stadt erforderlich'),
  website: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validierung
    const validatedData = workshopSchema.parse(body)

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

    // Geocode workshop address
    let latitude: number | null = null
    let longitude: number | null = null

    const geocodeResult = await geocodeAddress(
      validatedData.street,
      validatedData.zipCode,
      validatedData.city
    )
    
    if (geocodeResult) {
      latitude = geocodeResult.latitude
      longitude = geocodeResult.longitude
    } else {
      console.warn('Failed to geocode workshop address during registration')
    }

    // SEPA-Mandatsreferenz generieren
    const sepaMandateRef = `B24-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Kundennummer generieren (KD-YYYYMMDD-XXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    // Zähler für heute ermitteln
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    const workshopsToday = await prisma.workshop.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    })
    
    const counter = (workshopsToday + 1).toString().padStart(3, '0')
    const customerNumber = `KD-${dateStr}-${counter}`

    // User und Workshop erstellen
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
        role: 'WORKSHOP',
        workshop: {
          create: {
            customerNumber: customerNumber,
            companyName: validatedData.companyName,
            website: validatedData.website,
            description: validatedData.description,
            sepaMandateRef: sepaMandateRef,
            isVerified: false, // Admin muss verifizieren
          }
        }
      },
      include: {
        workshop: true
      }
    })

    // Willkommens-E-Mail senden
    try {
      await sendEmail({
        to: user.email,
        subject: 'Willkommen bei Bereifung24 - Verifizierung ausstehend',
        html: welcomeWorkshopEmailTemplate({
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: validatedData.companyName,
          email: user.email
        })
      })
      console.log('📧 Werkstatt-Willkommens-Email gesendet an:', user.email)
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError)
      // Fehler beim E-Mail-Versand nicht nach außen weitergeben
    }

    // Admin-Benachrichtigungen senden
    try {
      // @ts-ignore - Prisma types need regeneration after schema change
      const adminSettings = await prisma.adminNotificationSetting.findMany({
        where: {
          notifyWorkshopRegistration: true
        }
      }).catch(err => {
        console.error('Admin notification settings table not found:', err)
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
            subject: 'Neue Werkstatt-Registrierung - Freischaltung erforderlich',
            html: adminWorkshopRegistrationEmailTemplate({
              workshopName: `${user.firstName} ${user.lastName}`,
              companyName: validatedData.companyName,
              email: user.email,
              phone: user.phone || undefined,
              city: user.city || undefined,
              registrationDate: registrationDate,
              workshopId: user.workshop?.id || ''
            })
          }).catch(err => console.error(`Failed to send admin notification to ${admin.email}:`, err))
        }
      }
    } catch (adminEmailError) {
      console.error('Failed to send admin notifications:', adminEmailError)
      // Fehler bei Admin-Benachrichtigungen nicht nach außen weitergeben
    }

    // Track affiliate conversion if exists
    const affiliateCookie = request.headers.get('cookie')
    if (affiliateCookie) {
      const affiliateMatch = affiliateCookie.match(/affiliate_ref=([^;]+)/)
      if (affiliateMatch) {
        const affiliateRef = affiliateMatch[1]
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/affiliate/convert`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'WORKSHOP_REGISTRATION',
                customerId: user.id
              })
            }
          )
          console.log(`[AFFILIATE] Conversion tracked for ${affiliateRef} - Workshop registration`)
        } catch (conversionError) {
          console.error('[AFFILIATE] Failed to track workshop registration conversion:', conversionError)
          // Don't fail registration if conversion tracking fails
        }
      }
    }

    return NextResponse.json(
      { 
        message: 'Werkstatt erfolgreich registriert! Dein Account wird in Kürze verifiziert.',
        userId: user.id
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
    
    console.error('Workshop registration error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
