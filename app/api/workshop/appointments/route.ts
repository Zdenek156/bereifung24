import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWorkshopRequest } from '@/lib/workshop-auth'

// GET /api/workshop/appointments - Get all appointments/bookings for the workshop
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateWorkshopRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const workshopId = auth.workshopId

    // Get all regular bookings with related data
    const bookings = await prisma.booking.findMany({
      where: { workshopId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true,
              },
            },
          },
        },
        tireRequest: true,
        offer: true,
        review: true,
      },
      // Keine Sortierung - wird clientseitig gemacht
    })

    // Get all direct bookings (PayPal/Stripe)
    // Note: ALL direct bookings have customerId and vehicleId (validated at creation)
    console.log('🔍 [WORKSHOP APPOINTMENTS] Loading for workshop:', workshopId)
    
    const directBookings = await prisma.directBooking.findMany({
      where: { 
        workshopId
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true,
              }
            }
          }
        },
        vehicle: true
      }
    })

    console.log(`[APPOINTMENTS] Found ${directBookings.length} DirectBookings`)

    // Transform direct bookings to match appointment structure
    const transformedDirectBookings = directBookings.map(db => ({
      id: db.id,
      appointmentDate: db.date.toISOString(), // Convert Date to ISO string for frontend
      appointmentTime: db.time,
      estimatedDuration: db.durationMinutes || 60, // Use stored duration or default
      status: db.status,
      paymentStatus: db.paymentStatus,
      completedAt: null,
      customerNotes: null,
      workshopNotes: null,
      createdAt: db.createdAt.toISOString(), // When the booking was created
      isDirectBooking: true, // Flag to identify direct bookings
      paymentMethod: db.paymentMethod,
      totalPrice: Number(db.totalPrice),
      basePrice: Number(db.basePrice),
      balancingPrice: db.balancingPrice ? Number(db.balancingPrice) : null,
      storagePrice: db.storagePrice ? Number(db.storagePrice) : null,
      serviceType: db.serviceType,
      serviceSubtype: db.serviceSubtype || null,
      customer: {
        user: {
          firstName: db.customer.user.firstName,
          lastName: db.customer.user.lastName,
          email: db.customer.user.email,
          phone: db.customer.user.phone,
          street: db.customer.user.street,
          zipCode: db.customer.user.zipCode,
          city: db.customer.user.city,
        },
      },
      vehicle: db.vehicle,
      tireRequest: null,
      offer: null,
      review: null,
    }))

    // Merge all appointments (keine Sortierung - wird clientseitig gemacht)
    const allAppointments = [...bookings, ...transformedDirectBookings]

    return NextResponse.json(allAppointments)
  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Termine' },
      { status: 500 }
    )
  }
}
