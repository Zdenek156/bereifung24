import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { geocodeAddress } from '@/lib/geocoding'

const customerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  firstName: z.string().min(2, 'Vorname erforderlich'),
  lastName: z.string().min(2, 'Nachname erforderlich'),
  phone: z.string().optional(),
  street: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validierung
    const validatedData = customerSchema.parse(body)

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
        customer: {
          create: {}
        }
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json(
      { 
        message: 'Registrierung erfolgreich! Du kannst dich jetzt anmelden.',
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
    
    console.error('Customer registration error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
