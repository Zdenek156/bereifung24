import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/customer/vehicles - Get all vehicles for logged-in customer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get customer first, then their vehicles
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ vehicles: [] })
    }

    const vehicles = customer.vehicles

    // Transform data to match expected format
    const transformedVehicles = vehicles.map((vehicle: any) => ({
      id: vehicle.id,
      vehicleType: vehicle.vehicleType || 'CAR',
      make: vehicle.make || 'Unbekannt',
      model: vehicle.model || 'Unbekannt',
      year: vehicle.year || new Date().getFullYear(),
      licensePlate: vehicle.licensePlate || null,
      vin: vehicle.vin || null,
      nextInspectionDate: vehicle.nextInspectionDate ? vehicle.nextInspectionDate.toISOString() : null,
      inspectionReminder: vehicle.inspectionReminder || false,
      inspectionReminderDays: vehicle.inspectionReminderDays || 30,
      createdAt: vehicle.createdAt ? vehicle.createdAt.toISOString() : new Date().toISOString(),
    }))

    return NextResponse.json({ vehicles: transformedVehicles })
  } catch (error) {
    console.error('Error fetching customer vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}
