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
  emailNotifyOffers: z.boolean().optional(),
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
        customer: {
          select: {
            emailNotifyOffers: true
          }
        }
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
        customer: {
          select: {
            emailNotifyOffers: true
          }
        }
      }
    })

    // Update customer notification preferences if provided
    if (validatedData.emailNotifyOffers !== undefined) {
      await prisma.customer.updateMany({
        where: { userId: session.user.id },
        data: {
          emailNotifyOffers: validatedData.emailNotifyOffers
        }
      })
    }

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

// DELETE /api/user/profile - Delete own account (self-service)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Nicht authentifiziert oder keine Berechtigung' },
        { status: 401 }
      )
    }

    // Hole den Customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const userEmail = customer.user.email

    // Prüfe ob Email bereits in Blacklist ist
    const existingBlacklist = await prisma.deletedUserEmail.findUnique({
      where: { email: userEmail.toLowerCase() }
    })

    // Speichere Email in Blacklist nur wenn noch nicht vorhanden
    if (!existingBlacklist) {
      await prisma.deletedUserEmail.create({
        data: {
          email: userEmail.toLowerCase(),
          userType: 'CUSTOMER',
          reason: 'Account selbst gelöscht',
          deletedBy: userEmail
        }
      })
    }

    // Lösche alle abhängigen Daten in der richtigen Reihenfolge
    
    // 1. Lösche alle Bookings ZUERST (haben FK zu Offers)
    await prisma.booking.deleteMany({
      where: { customerId: customer.id }
    })

    // 2. Lösche alle Angebote zu den TireRequests des Kunden
    await prisma.offer.deleteMany({
      where: {
        tireRequest: {
          customerId: customer.id
        }
      }
    })

    // 3. Lösche alle TireRequests
    await prisma.tireRequest.deleteMany({
      where: { customerId: customer.id }
    })

    // 4. Lösche alle Reviews
    await prisma.review.deleteMany({
      where: { customerId: customer.id }
    })

    // 5. Lösche alle TireRatings
    await prisma.tireRating.deleteMany({
      where: { customerId: customer.id }
    })

    // 6. Lösche TireHistory Einträge (über Vehicle)
    const customerVehicles = await prisma.vehicle.findMany({
      where: { customerId: customer.id },
      select: { id: true }
    })
    
    if (customerVehicles.length > 0) {
      await prisma.tireHistory.deleteMany({
        where: {
          vehicleId: {
            in: customerVehicles.map(v => v.id)
          }
        }
      })
    }

    // 7. Lösche alle Vehicles
    await prisma.vehicle.deleteMany({
      where: { customerId: customer.id }
    })

    // 8. Lösche WeatherAlert falls vorhanden
    await prisma.weatherAlert.deleteMany({
      where: { customerId: customer.id }
    })

    // 9. Anonymisiere Affiliate Conversions (Influencer behält die Provision)
    await prisma.affiliateConversion.updateMany({
      where: { customerId: customer.id },
      data: { customerId: null }
    })

    // 10. Lösche den Customer
    await prisma.customer.delete({
      where: { id: customer.id }
    })

    // 11. Lösche den User
    await prisma.user.delete({
      where: { id: session.user.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Ihr Account wurde erfolgreich gelöscht. Die E-Mail-Adresse wurde für zukünftige Registrierungen gesperrt.' 
    })

  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Accounts' },
      { status: 500 }
    )
  }
}
