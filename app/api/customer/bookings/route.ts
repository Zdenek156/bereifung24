import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Nur für Kunden
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Alle Buchungen des Kunden abrufen (nur CONFIRMED und COMPLETED, keine RESERVED)
    console.log('[BOOKINGS API] Fetching bookings for customer:', session.user.id)
    
    // DEBUG: Check ALL bookings from today
    const today = new Date('2026-02-10T00:00:00.000Z')
    const todayBookings = await prisma.directBooking.findMany({
      where: { createdAt: { gte: today } },
      select: { id: true, status: true, paymentStatus: true, customerId: true, createdAt: true }
    })
    console.log('[BOOKINGS API DEBUG] ALL bookings created today:', JSON.stringify(todayBookings))
    
    // DEBUG: Check ALL bookings without filter
    const allBookings = await prisma.directBooking.findMany({
      where: { customerId: session.user.id },
      select: { id: true, status: true, paymentStatus: true, date: true, createdAt: true }
    })
    console.log('[BOOKINGS API DEBUG] ALL bookings (no filter):', JSON.stringify(allBookings))
    
    const bookings = await prisma.directBooking.findMany({
      where: {
        customerId: session.user.id,
        status: {
          in: ['CONFIRMED', 'COMPLETED', 'CANCELLED']
        }
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                email: true,
                phone: true,
                street: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            licensePlate: true,
            year: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Decimal-Felder zu Numbers konvertieren, Datum zu ISO String
    const bookingsData = bookings.map(booking => ({
      ...booking,
      date: booking.date.toISOString(), // Explizit zu ISO String konvertieren
      basePrice: Number(booking.basePrice),
      balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : null,
      storagePrice: booking.storagePrice ? Number(booking.storagePrice) : null,
      totalPrice: Number(booking.totalPrice)
    }))

    console.log('[BOOKINGS API] Found', bookingsData.length, 'bookings for customer')

    return NextResponse.json({
      success: true,
      bookings: bookingsData
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchungen' },
      { status: 500 }
    )
  }
}
