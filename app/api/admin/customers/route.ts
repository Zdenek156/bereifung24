import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { requireAdminOrEmployee } from '@/lib/permissions'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'recent'

    // Basis-Referenzpunkt für Entfernungsberechnung (Bereifung24 Standort: Markgröningen)
    const baseLatitude = 48.9074
    const baseLongitude = 9.0803

    // Kunden mit zugehörigen Daten abrufen
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      include: {
        customer: {
          include: {
            bookings: {
              where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
              include: {
                offer: { select: { price: true } }
              }
            },
            directBookings: {
              where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
              select: { totalPrice: true }
            }
          }
        }
      }
    })

    // Daten aufbereiten
    const customersData = customers.map(user => {
      const bookingCount = (user.customer?.bookings.length || 0) + (user.customer?.directBookings.length || 0)
      const bookingRevenue = (user.customer?.bookings.reduce((sum, b) => sum + (b.offer?.price || 0), 0) || 0)
        + (user.customer?.directBookings.reduce((sum, db) => sum + Number(db.totalPrice || 0), 0) || 0)

      // Entfernung berechnen (Haversine-Formel)
      let distance: number | null = null
      if (user.latitude && user.longitude) {
        const R = 6371 // Erdradius in km
        const dLat = (user.latitude - baseLatitude) * Math.PI / 180
        const dLon = (user.longitude - baseLongitude) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(baseLatitude * Math.PI / 180) * Math.cos(user.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = Math.round(R * c)
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        street: user.street,
        city: user.city,
        zipCode: user.zipCode,
        distance,
        bookingCount,
        totalSpent: bookingRevenue,
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    })

    // Sortierung
    let sortedCustomers = [...customersData]
    switch (sortBy) {
      case 'recent':
        sortedCustomers.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case 'distance':
        sortedCustomers.sort((a, b) => {
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })
        break
      case 'requests':
        sortedCustomers.sort((a, b) => b.bookingCount - a.bookingCount)
        break
      case 'revenue':
        sortedCustomers.sort((a, b) => b.totalSpent - a.totalSpent)
        break
    }

    return NextResponse.json({ customers: sortedCustomers })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
