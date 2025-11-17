import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

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
        role: 'WORKSHOP',
        workshop: {
          create: {
            companyName: validatedData.companyName,
            street: validatedData.street,
            zipCode: validatedData.zipCode,
            city: validatedData.city,
            phone: validatedData.phone,
            website: validatedData.website,
            description: validatedData.description,
            sepaMandateRef: sepaMandateRef,
            isVerified: false, // Admin muss verifizieren
            isActive: true,
          }
        }
      },
      include: {
        workshop: true
      }
    })

    return NextResponse.json(
      { 
        message: 'Werkstatt erfolgreich registriert! Dein Account wird in Kürze verifiziert.',
        userId: user.id,
        workshopId: user.workshop?.id
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
