import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { geocodeAddress } from '@/lib/geocoding'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, street, zipCode, city } = await request.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !zipCode || !city) {
      return NextResponse.json(
        { error: 'Alle Pflichtfelder müssen ausgefüllt werden' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Geocode address
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

    // Create user and customer
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        street,
        zipCode,
        city,
        latitude,
        longitude,
        role: 'CUSTOMER',
        customer: {
          create: {}
        }
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registrierung erfolgreich',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registrierungsfehler' },
      { status: 500 }
    )
  }
}
