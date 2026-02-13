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

    // Get vehicle with tire specs
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        customer: {
          userId: session.user.id
        }
      },
      select: {
        id: true,
        vehicleType: true,
        summerTires: true,
        winterTires: true,
        allSeasonTires: true,
        currentTires: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            width: true,
            aspectRatio: true,
            diameter: true
          }
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

    // 2. Check JSON tire strings (fallback) - Priority: summer > winter > allSeason
    if (!dimensions) {
      const tireJsonSources = [
        vehicle.summerTires,
        vehicle.winterTires,
        vehicle.allSeasonTires
      ]

      for (const tireJson of tireJsonSources) {
        if (!tireJson) continue
        
        try {
          const parsed = typeof tireJson === 'string' ? JSON.parse(tireJson) : tireJson
          if (parsed.width && parsed.aspectRatio && parsed.diameter) {
            dimensions = {
              width: parsed.width,
              height: parsed.aspectRatio,
              diameter: parsed.diameter
            }
            break
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    if (!dimensions) {
      return NextResponse.json({ 
        success: false, 
        error: 'Keine Reifendimensionen für dieses Fahrzeug hinterlegt' 
      }, { status: 404 })
    }

    // Check for mixed tire setup from JSON data (hasDifferentSizes flag)
    let hasMixedTires = false
    let dimensionsFront = null
    let dimensionsRear = null

    const tireJsonSources = [
      vehicle.summerTires,
      vehicle.winterTires,
      vehicle.allSeasonTires
    ]

    for (const tireJson of tireJsonSources) {
      if (!tireJson) continue
      
      try {
        const parsed = typeof tireJson === 'string' ? JSON.parse(tireJson) : tireJson
        
        if (parsed.hasDifferentSizes && parsed.rearWidth && parsed.rearAspectRatio && parsed.rearDiameter) {
          // Front dimensions
          dimensionsFront = {
            width: parsed.width,
            height: parsed.aspectRatio,
            diameter: parsed.diameter,
            formatted: `${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`
          }
          
          // Rear dimensions
          dimensionsRear = {
            width: parsed.rearWidth,
            height: parsed.rearAspectRatio,
            diameter: parsed.rearDiameter,
            formatted: `${parsed.rearWidth}/${parsed.rearAspectRatio} R${parsed.rearDiameter}`
          }
          
          hasMixedTires = true
          break
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return NextResponse.json({ 
      success: true, 
      dimensions,
      hasMixedTires,
      dimensionsFront,
      dimensionsRear,
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
