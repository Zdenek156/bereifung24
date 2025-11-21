import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/geocoding'
import { sendEmail, welcomeWorkshopEmailTemplate, adminWorkshopRegistrationEmailTemplate } from '@/lib/email'

const workshopSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
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
          companyName: validatedData.companyName,
          email: user.email
        })
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Fehler beim E-Mail-Versand nicht nach außen weitergeben
    }

    // Admin-Benachrichtigungen senden
    try {
      // @ts-ignore - Prisma types need regeneration after schema change
      const adminSettings = await prisma.adminNotificationSetting.findMany({
        where: {
          notifyWorkshopRegistration: true
        }
      })

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
    } catch (adminEmailError) {
      console.error('Failed to send admin notifications:', adminEmailError)
      // Fehler bei Admin-Benachrichtigungen nicht nach außen weitergeben
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
