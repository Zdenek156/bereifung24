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

const vehicleUpdateSchema = z.object({
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRAILER']).optional(),
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

// PUT /api/vehicles/[id] - Update a vehicle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if vehicle belongs to this customer
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id }
    })

    if (!vehicle || vehicle.customerId !== customer.id) {
      return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const validated = vehicleUpdateSchema.parse(body)

    // Store tire data as JSON (will be migrated later)
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

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        vehicleType: validated.vehicleType || 'CAR',
        make: validated.make,
        model: validated.model,
        year: validated.year,
        licensePlate: validated.licensePlate,
        vin: validated.vin || JSON.stringify(tireData),
        nextInspectionDate: inspectionDate,
        inspectionReminder: validated.inspectionReminder,
        inspectionReminderDays: validated.inspectionReminderDays,
      }
    })

    return NextResponse.json({ 
      id: updatedVehicle.id,
      message: 'Fahrzeug erfolgreich aktualisiert' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: error.errors }, { status: 400 })
    }
    console.error('PUT /api/vehicles/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE /api/vehicles/[id] - Delete a vehicle
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if vehicle belongs to this customer
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id }
    })

    if (!vehicle || vehicle.customerId !== customer.id) {
      return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 })
    }

    // Delete vehicle
    await prisma.vehicle.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Fahrzeug gelöscht' })
  } catch (error) {
    console.error('DELETE /api/vehicles/[id] error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
