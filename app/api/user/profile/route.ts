import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation Schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  street: z.string().min(1),
  zipCode: z.string().min(1),
  city: z.string().min(1),
  customerType: z.enum(['PRIVATE', 'BUSINESS']),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
})

// GET /api/user/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        zipCode: true,
        city: true,
        customerType: true,
        companyName: true,
        taxId: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden des Profils' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await req.json()
    
    // Validate request body
    const validatedData = profileUpdateSchema.parse(body)

    // Additional validation for business customers
    if (validatedData.customerType === 'BUSINESS' && !validatedData.companyName) {
      return NextResponse.json(
        { error: 'Firmenname ist erforderlich für gewerbliche Kunden' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        street: validatedData.street,
        zipCode: validatedData.zipCode,
        city: validatedData.city,
        customerType: validatedData.customerType,
        companyName: validatedData.companyName || null,
        taxId: validatedData.taxId || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        zipCode: true,
        city: true,
        customerType: true,
        companyName: true,
        taxId: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Profils' },
      { status: 500 }
    )
  }
}
