import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({
        nextAppointment: null,
        recentBookings: [],
        tireStorage: [],
        totalCompletedBookings: 0
      })
    }

    const now = new Date()

    // Next upcoming appointment (DirectBooking with future date, CONFIRMED or RESERVED)
    const nextDirectBooking = await prisma.directBooking.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['CONFIRMED', 'RESERVED'] },
        date: { gte: now }
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                street: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Also check legacy Booking model
    const nextLegacyBooking = await prisma.booking.findFirst({
      where: {
        tireRequest: { customerId: customer.id },
        status: { in: ['CONFIRMED', 'PENDING'] },
        appointmentDate: { gte: now }
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                street: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        tireRequest: {
          select: {
            serviceType: true,
            vehicle: {
              select: {
                make: true,
                model: true,
                licensePlate: true
              }
            }
          }
        }
      },
      orderBy: { appointmentDate: 'asc' }
    })

    // Determine which is next
    let nextAppointment = null

    if (nextDirectBooking && nextLegacyBooking) {
      const directDate = new Date(nextDirectBooking.date)
      const legacyDate = new Date(nextLegacyBooking.appointmentDate)
      if (directDate <= legacyDate) {
        nextAppointment = formatDirectBooking(nextDirectBooking)
      } else {
        nextAppointment = formatLegacyBooking(nextLegacyBooking)
      }
    } else if (nextDirectBooking) {
      nextAppointment = formatDirectBooking(nextDirectBooking)
    } else if (nextLegacyBooking) {
      nextAppointment = formatLegacyBooking(nextLegacyBooking)
    }

    // Recent completed bookings (last 3)
    const recentDirectBookings = await prisma.directBooking.findMany({
      where: {
        customerId: customer.id,
        status: 'COMPLETED'
      },
      include: {
        workshop: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 3
    })

    const recentBookings = recentDirectBookings.map(b => ({
      id: b.id,
      date: b.date.toISOString(),
      workshopName: b.workshop.companyName,
      serviceType: getServiceLabel(b.serviceType),
      totalPrice: Number(b.totalPrice)
    }))

    // Total completed bookings count
    const totalCompletedBookings = await prisma.directBooking.count({
      where: {
        customerId: customer.id,
        status: 'COMPLETED'
      }
    })

    // Tire storage: Find bookings with hasStorage=true and status COMPLETED or CONFIRMED
    // These represent tires currently stored at the workshop
    const storageBookings = await prisma.directBooking.findMany({
      where: {
        customerId: customer.id,
        hasStorage: true,
        status: { in: ['COMPLETED', 'CONFIRMED'] },
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                street: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Group by workshop, take only most recent per workshop (= active storage)
    const seenWorkshops = new Set<string>()
    const tireStorage = storageBookings
      .filter(b => {
        if (seenWorkshops.has(b.workshopId)) return false
        seenWorkshops.add(b.workshopId)
        return true
      })
      .map(b => {
        // Determine tire season from service type and month
        const bookingMonth = new Date(b.date).getMonth() + 1
        // If the service was wheel change WITH storage, the stored tires are the OPPOSITE season
        const isWinterStoredMonth = bookingMonth >= 3 && bookingMonth <= 9 // Spring/Summer change: storing winter tires
        const storedTireType = isWinterStoredMonth ? 'Winterreifen' : 'Sommerreifen'

        return {
          id: b.id,
          workshopId: b.workshop.id,
          workshopName: b.workshop.companyName,
          workshopSlug: null,
          workshopAddress: [b.workshop.user.street, b.workshop.user.zipCode, b.workshop.user.city].filter(Boolean).join(', '),
          vehicleName: `${b.vehicle.make} ${b.vehicle.model}`,
          vehiclePlate: b.vehicle.licensePlate,
          storedTireType,
          storedSince: b.date.toISOString()
        }
      })

    return NextResponse.json({
      nextAppointment,
      recentBookings,
      tireStorage,
      totalCompletedBookings
    })

  } catch (error) {
    console.error('[Dashboard Summary] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

function getServiceLabel(type: string): string {
  const labels: Record<string, string> = {
    WHEEL_CHANGE: 'Räderwechsel',
    TIRE_CHANGE: 'Reifenwechsel',
    TIRE_HOTEL: 'Reifenhotel',
    WHEEL_ALIGNMENT: 'Achsvermessung',
    TIRE_REPAIR: 'Reifenreparatur',
    NEW_TIRES: 'Neue Reifen',
    MOTORCYCLE_TIRE: 'Motorradreifenmontage',
    ALIGNMENT_BOTH: 'Achsvermessung',
    CLIMATE_SERVICE: 'Klimaservice',
    BRAKE_SERVICE: 'Bremsenservice',
    BATTERY_SERVICE: 'Batterieservice'
  }
  return labels[type] || type
}

function formatDirectBooking(booking: any) {
  return {
    id: booking.id,
    type: 'direct',
    date: booking.date.toISOString(),
    time: booking.time,
    workshopName: booking.workshop.companyName,
    workshopId: booking.workshop.id,
    workshopAddress: [booking.workshop.user.street, booking.workshop.user.zipCode, booking.workshop.user.city].filter(Boolean).join(', '),
    serviceType: getServiceLabel(booking.serviceType),
    vehicleName: `${booking.vehicle.make} ${booking.vehicle.model}`,
    status: booking.status,
    totalPrice: Number(booking.totalPrice)
  }
}

function formatLegacyBooking(booking: any) {
  return {
    id: booking.id,
    type: 'legacy',
    date: booking.appointmentDate.toISOString(),
    time: booking.appointmentTime,
    workshopName: booking.workshop.companyName,
    workshopId: booking.workshop.id,
    workshopAddress: [booking.workshop.user.street, booking.workshop.user.zipCode, booking.workshop.user.city].filter(Boolean).join(', '),
    serviceType: getServiceLabel(booking.tireRequest?.serviceType || ''),
    vehicleName: booking.tireRequest?.vehicle
      ? `${booking.tireRequest.vehicle.make} ${booking.tireRequest.vehicle.model}`
      : '',
    status: booking.status,
    totalPrice: 0
  }
}
