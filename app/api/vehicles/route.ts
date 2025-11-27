import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation Schema
const tireSpecSchema = z.object({
  width: z.number().min(135).max(395),
  aspectRatio: z.number().min(25).max(85),
  diameter: z.number().min(13).max(24),
  loadIndex: z.number().min(50).max(120).optional(),
  speedRating: z.string().optional(),
  hasDifferentSizes: z.boolean().optional(),
  rearWidth: z.number().min(135).max(395).optional(),
  rearAspectRatio: z.number().min(25).max(85).optional(),
  rearDiameter: z.number().min(13).max(24).optional(),
  rearLoadIndex: z.number().min(50).max(120).optional(),
  rearSpeedRating: z.string().optional(),
})

const vehicleSchema = z.object({
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRAILER']).default('CAR'),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1980).max(new Date().getFullYear() + 1),
  licensePlate: z.string().optional(),
  vin: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  inspectionReminder: z.boolean().optional(),
  inspectionReminderDays: z.number().min(1).max(90).optional(),
  summerTires: tireSpecSchema.optional(),
  winterTires: tireSpecSchema.optional(),
  allSeasonTires: tireSpecSchema.optional(),
})

// GET /api/vehicles - Get all vehicles for logged-in customer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    // Get all vehicles with tire data
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' }
    })

    // Transform data to include tire specs grouped by season
    const transformedVehicles = vehicles.map((vehicle: any) => {
      const result: any = {
        id: vehicle.id,
        vehicleType: vehicle.vehicleType || 'CAR',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        nextInspectionDate: vehicle.nextInspectionDate?.toISOString(),
        inspectionReminder: vehicle.inspectionReminder,
        inspectionReminderDays: vehicle.inspectionReminderDays,
        createdAt: vehicle.createdAt.toISOString(),
      }

      // Get summer tires data from vin field (temporary storage as JSON)
      if (vehicle.vin) {
        try {
          const tireData = JSON.parse(vehicle.vin)
          result.summerTires = tireData.summerTires
          result.winterTires = tireData.winterTires
          result.allSeasonTires = tireData.allSeasonTires
        } catch (e) {
          // Ignore parse errors - vin might be actual VIN string
        }
      }

      return result
    })

    return NextResponse.json(transformedVehicles)
  } catch (error) {
    console.error('GET /api/vehicles error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// POST /api/vehicles - Create new vehicle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const validated = vehicleSchema.parse(body)

    // Store tire data as JSON in a separate field (will be migrated later)
    const tireData: any = {}
    if (validated.summerTires) tireData.summerTires = validated.summerTires
    if (validated.winterTires) tireData.winterTires = validated.winterTires
    if (validated.allSeasonTires) tireData.allSeasonTires = validated.allSeasonTires

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        vehicleType: validated.vehicleType,
        make: validated.make,
        model: validated.model,
        year: validated.year,
        licensePlate: validated.licensePlate,
        vin: validated.vin || JSON.stringify(tireData), // Use VIN if provided, otherwise tire data
        nextInspectionDate: validated.nextInspectionDate ? new Date(validated.nextInspectionDate) : null,
        inspectionReminder: validated.inspectionReminder || false,
        inspectionReminderDays: validated.inspectionReminderDays || 30,
      }
    })

    return NextResponse.json({ 
      id: vehicle.id,
      message: 'Fahrzeug erfolgreich hinzugefügt' 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/vehicles error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
