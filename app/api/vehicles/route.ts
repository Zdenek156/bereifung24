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
      try {
        // Ensure all required fields exist with defaults
        const result: any = {
          id: vehicle.id || '',
          vehicleType: vehicle.vehicleType || 'CAR',
          make: vehicle.make || 'Unbekannt',
          model: vehicle.model || 'Unbekannt',
          year: vehicle.year || new Date().getFullYear(),
          licensePlate: vehicle.licensePlate || null,
          vin: null, // Will be set below if actual VIN
          nextInspectionDate: null,
          inspectionReminder: false,
          inspectionReminderDays: 30,
          createdAt: new Date().toISOString(),
        }

        // Safely handle inspection date
        try {
          if (vehicle.nextInspectionDate) {
            result.nextInspectionDate = vehicle.nextInspectionDate.toISOString()
          }
        } catch (e) {
          console.error('Error parsing inspection date:', e)
        }

        // Safely handle other fields
        if (typeof vehicle.inspectionReminder === 'boolean') {
          result.inspectionReminder = vehicle.inspectionReminder
        }
        if (typeof vehicle.inspectionReminderDays === 'number') {
          result.inspectionReminderDays = vehicle.inspectionReminderDays
        }
        if (vehicle.createdAt) {
          try {
            result.createdAt = vehicle.createdAt.toISOString()
          } catch (e) {
            // Keep default
          }
        }

        // Check if vin field contains JSON tire data or actual VIN
        if (vehicle.vin) {
          try {
            // Try to parse as JSON (tire data)
            const tireData = JSON.parse(vehicle.vin)
            if (tireData.summerTires || tireData.winterTires || tireData.allSeasonTires) {
              // It's tire data
              result.summerTires = tireData.summerTires
              result.winterTires = tireData.winterTires
              result.allSeasonTires = tireData.allSeasonTires
            } else {
              // Empty JSON, treat as no VIN
              result.vin = null
            }
          } catch (e) {
            // Not JSON, must be actual VIN string
            result.vin = vehicle.vin
          }
        }

        return result
      } catch (itemError) {
        console.error('Error transforming vehicle:', vehicle.id, itemError)
        // Return minimal vehicle data on error
        return {
          id: vehicle.id,
          vehicleType: 'CAR',
          make: vehicle.make || 'Unbekannt',
          model: vehicle.model || 'Unbekannt',
          year: vehicle.year || new Date().getFullYear(),
          licensePlate: null,
          vin: null,
          nextInspectionDate: null,
          inspectionReminder: false,
          inspectionReminderDays: 30,
          createdAt: new Date().toISOString(),
        }
      }
    })

    return NextResponse.json(transformedVehicles)
  } catch (error) {
    console.error('GET /api/vehicles error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: 'Fehler beim Laden der Fahrzeuge',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
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

    // Parse inspection date - handle both YYYY-MM and YYYY-MM-DD formats
    let inspectionDate = null
    if (validated.nextInspectionDate) {
      try {
        // If format is YYYY-MM, add -01 to make it a valid date
        const dateStr = validated.nextInspectionDate.length === 7 
          ? `${validated.nextInspectionDate}-01` 
          : validated.nextInspectionDate
        inspectionDate = new Date(dateStr)
      } catch (e) {
        console.error('Error parsing inspection date:', e)
      }
    }

    // Prepare vehicle data
    const vehicleData: any = {
      customerId: customer.id,
      vehicleType: validated.vehicleType || 'CAR',
      make: validated.make,
      model: validated.model,
      year: validated.year,
      licensePlate: validated.licensePlate || null,
      nextInspectionDate: inspectionDate,
      inspectionReminder: validated.inspectionReminder || false,
      inspectionReminderDays: validated.inspectionReminderDays || 30,
    }

    // Only set VIN if provided and not empty
    if (validated.vin && validated.vin.trim().length > 0) {
      vehicleData.vin = validated.vin.trim()
    } else {
      // Store tire data as JSON if VIN not provided
      const hasTireData = Object.keys(tireData).length > 0
      if (hasTireData) {
        vehicleData.vin = JSON.stringify(tireData)
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: vehicleData
    })

    return NextResponse.json({ 
      id: vehicle.id,
      message: 'Fahrzeug erfolgreich hinzugefügt' 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({ error: 'Ungültige Daten', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/vehicles error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    
    // Check for Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: 'Fahrzeug mit dieser VIN existiert bereits' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}
