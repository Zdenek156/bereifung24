import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/services - Get all services for a workshop
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: {
          include: {
            workshopServices: {
              orderBy: {
                serviceType: 'asc'
              }
            }
          }
        }
      }
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ services: user.workshop.workshopServices })
  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Services' },
      { status: 500 }
    )
  }
}

// POST /api/workshop/services - Create a new service
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: true
      }
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      serviceType,
      basePrice,
      runFlatSurcharge,
      disposalFee,
      wheelSizeSurcharge,
      durationMinutes,
      description,
      internalNotes,
      isActive
    } = body

    // Check if service already exists
    const existingService = await prisma.workshopService.findUnique({
      where: {
        workshopId_serviceType: {
          workshopId: user.workshop.id,
          serviceType
        }
      }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service existiert bereits' },
        { status: 400 }
      )
    }

    const service = await prisma.workshopService.create({
      data: {
        workshopId: user.workshop.id,
        serviceType,
        basePrice: parseFloat(basePrice),
        runFlatSurcharge: runFlatSurcharge ? parseFloat(runFlatSurcharge) : null,
        disposalFee: disposalFee ? parseFloat(disposalFee) : null,
        wheelSizeSurcharge: wheelSizeSurcharge || null,
        durationMinutes: parseInt(durationMinutes),
        description: description || null,
        internalNotes: internalNotes || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Services' },
      { status: 500 }
    )
  }
}
