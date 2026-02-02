import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { requireAdminOrEmployee } from '@/lib/permissions'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { isActive } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive }
    })

    return NextResponse.json({ success: true, user: updatedUser })

  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const session = await getServerSession(authOptions)

    // Hole den Customer mit User ID
    const customer = await prisma.customer.findUnique({
      where: { userId: params.id },
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
          reason: `Kunde gelöscht durch ${session.user.email}`,
          deletedBy: session.user.email
        }
      })
    }

    // Lösche alle abhängigen Daten manuell in der richtigen Reihenfolge
    
    // 1. Hole alle Bookings des Kunden
    const customerBookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      select: { id: true }
    })

    // 2. Lösche alle Commissions zu diesen Bookings (haben FK zu Bookings)
    if (customerBookings.length > 0) {
      await prisma.commission.deleteMany({
        where: {
          bookingId: {
            in: customerBookings.map(b => b.id)
          }
        }
      })
    }

    // 3. Lösche alle Bookings
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

    // 8. Anonymisiere Affiliate Conversions statt sie zu löschen
    // Wichtig: Influencer behält die Provision, aber Customer-Verknüpfung wird entfernt
    await prisma.affiliateConversion.updateMany({
      where: { customerId: customer.id },
      data: { customerId: null }
    })

    // 9. Lösche den Customer
    await prisma.customer.delete({
      where: { id: customer.id }
    })

    // 10. Lösche den User
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Kunde erfolgreich gelöscht. Email-Adresse gesperrt für zukünftige Registrierungen.' 
    })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Kunden' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
