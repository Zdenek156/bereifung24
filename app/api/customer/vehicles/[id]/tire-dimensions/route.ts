import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/customer/vehicles/[id]/tire-dimensions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const vehicleId = params.id

    // Get vehicle with current tires
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        customer: {
          userId: session.user.id
        }
      },
      include: {
        currentTires: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 })
    }

    // Try to extract tire dimensions from various sources
    let dimensions = null

    // 1. Check currentTires (preferred)
    if (vehicle.currentTires && vehicle.currentTires.length > 0) {
      const tire = vehicle.currentTires[0]
      dimensions = {
        width: tire.width,
        height: tire.aspectRatio,
        diameter: tire.diameter
      }
    }

    // 2. Check JSON tire strings (fallback)
    if (!dimensions) {
      try {
        // Try summerTires first
        if (vehicle.summerTires) {
          const parsed = JSON.parse(vehicle.summerTires)
          if (parsed.width && parsed.aspectRatio && parsed.diameter) {
            dimensions = {
              width: parsed.width,
              height: parsed.aspectRatio,
              diameter: parsed.diameter
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // 3. Try winterTires
    if (!dimensions && vehicle.winterTires) {
      try {
        const parsed = JSON.parse(vehicle.winterTires)
        if (parsed.width && parsed.aspectRatio && parsed.diameter) {
          dimensions = {
            width: parsed.width,
            height: parsed.aspectRatio,
            diameter: parsed.diameter
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    // 4. Try allSeasonTires
    if (!dimensions && vehicle.allSeasonTires) {
      try {
        const parsed = JSON.parse(vehicle.allSeasonTires)
        if (parsed.width && parsed.aspectRatio && parsed.diameter) {
          dimensions = {
            width: parsed.width,
            height: parsed.aspectRatio,
            diameter: parsed.diameter
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (!dimensions) {
      return NextResponse.json({ 
        success: false, 
        error: 'Keine Reifendimensionen für dieses Fahrzeug hinterlegt' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      dimensions,
      vehicleType: vehicle.vehicleType || 'CAR'
    })
  } catch (error) {
    console.error('Error fetching tire dimensions:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Laden der Reifendimensionen' },
      { status: 500 }
    )
  }
}
