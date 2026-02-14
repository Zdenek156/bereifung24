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
          select: {
            id: true,
            vehicleType: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            vin: true,
            nextInspectionDate: true,
            inspectionReminder: true,
            inspectionReminderDays: true,
            createdAt: true,
            summerTires: true,
            winterTires: true,
            allSeasonTires: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ success: true, vehicles: [] })
    }

    const vehicles = customer.vehicles

    // Transform data to match expected format with available seasons info
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
      // Include which tire seasons are available (boolean flags)
      availableSeasons: {
        summer: !!vehicle.summerTires,
        winter: !!vehicle.winterTires,
        allSeason: !!vehicle.allSeasonTires
      }
    }))

    return NextResponse.json({ success: true, vehicles: transformedVehicles })
  } catch (error) {
    console.error('Error fetching customer vehicles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}
