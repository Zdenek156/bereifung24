import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/workshop/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const body = await request.json()
    const { customerId } = body

    // Verify customer belongs to workshop
    const customer = await prisma.workshopCustomer.findFirst({
      where: {
        id: customerId,
        workshopId: user.workshop.id,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Create vehicle
    const vehicle = await prisma.workshopVehicle.create({
      data: {
        customerId,
        licensePlate: body.licensePlate,
        vin: body.vin,
        manufacturer: body.manufacturer,
        model: body.model,
        modelYear: body.modelYear,
        color: body.color,
        engineType: body.engineType,
        fuelType: body.fuelType,
        transmission: body.transmission,
        displacement: body.displacement,
        power: body.power,
        frontTireSize: body.frontTireSize,
        rearTireSize: body.rearTireSize,
        wheelSize: body.wheelSize,
        currentMileage: body.currentMileage,
        lastMileageUpdate: body.currentMileage ? new Date() : null,
        firstRegistration: body.firstRegistration ? new Date(body.firstRegistration) : null,
        nextInspection: body.nextInspection ? new Date(body.nextInspection) : null,
        notes: body.notes,
        source: 'MANUAL',
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      vehicle,
    })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}
