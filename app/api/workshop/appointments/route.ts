import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/appointments - Get all appointments/bookings for the workshop
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get workshop ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get all regular bookings with related data
    const bookings = await prisma.booking.findMany({
      where: { workshopId: user.workshop.id },
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
    // Load customers and vehicles separately to avoid Prisma validation errors on null relations
    const directBookingsRaw = await prisma.directBooking.findMany({
      where: { 
        workshopId: user.workshop.id,
        customerId: { not: null },
        vehicleId: { not: null }
      },
      // Keine Sortierung - wird clientseitig gemacht
    })

    // Load customers and vehicles separately
    const customerIds = [...new Set(directBookingsRaw.map(db => db.customerId).filter(id => id !== null))]
    const vehicleIds = [...new Set(directBookingsRaw.map(db => db.vehicleId).filter(id => id !== null))]
    
    const customers = await prisma.user.findMany({
      where: { id: { in: customerIds as string[] } }
    })
    
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds as string[] } }
    })

    // Create lookup maps
    const customerMap = new Map(customers.map(c => [c.id, c]))
    const vehicleMap = new Map(vehicles.map(v => [v.id, v]))

    // Attach customer and vehicle data
    const directBookings = directBookingsRaw
      .map(db => ({
        ...db,
        customer: db.customerId ? customerMap.get(db.customerId) : null,
        vehicle: db.vehicleId ? vehicleMap.get(db.vehicleId) : null
      }))
      .filter(db => db.customer !== null && db.customer !== undefined && db.vehicle !== null && db.vehicle !== undefined)

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
      isDirectBooking: true, // Flag to identify direct bookings
      paymentMethod: db.paymentMethod,
      totalPrice: Number(db.totalPrice),
      basePrice: Number(db.basePrice),
      balancingPrice: db.balancingPrice ? Number(db.balancingPrice) : null,
      storagePrice: db.storagePrice ? Number(db.storagePrice) : null,
      serviceType: db.serviceType,
      customer: {
        user: {
          firstName: db.customer.firstName,
          lastName: db.customer.lastName,
          email: db.customer.email,
          phone: db.customer.phone,
          street: db.customer.street,
          zipCode: db.customer.zipCode,
          city: db.customer.city,
        },
      },
      vehicle: db.vehicle,
      serviceType: db.serviceType,
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
