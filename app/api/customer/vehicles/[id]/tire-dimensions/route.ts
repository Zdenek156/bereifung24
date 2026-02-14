import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/customer/vehicles/[id]/tire-dimensions?season=s|w|g
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
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season') || 's' // Default to summer

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
        allSeasonTires: true
      }
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Fahrzeug nicht gefunden' }, { status: 404 })
    }

    // ALWAYS check season-specific tire data first for season-based searches
    // Do NOT fallback to currentTires, as user expects season-specific dimensions
    let dimensions = null
    let primaryTireJson = null
    let seasonName = ''
    
    // Select tire source based on season
    if (season === 's') {
      primaryTireJson = vehicle.summerTires
      seasonName = 'Sommerreifen'
    } else if (season === 'w') {
      primaryTireJson = vehicle.winterTires
      seasonName = 'Winterreifen'
    } else if (season === 'g') {
      primaryTireJson = vehicle.allSeasonTires
      seasonName = 'Ganzjahresreifen'
    }
    
    // Try to parse the selected season's tire data
    if (primaryTireJson) {
      try {
        const parsed = typeof primaryTireJson === 'string' ? JSON.parse(primaryTireJson) : primaryTireJson
        if (parsed.width && parsed.aspectRatio && parsed.diameter) {
          dimensions = {
            width: parsed.width,
            height: parsed.aspectRatio,
            diameter: parsed.diameter,
            loadIndex: parsed.loadIndex?.toString(),
            speedIndex: parsed.speedIndex || parsed.speedRating
          }
          
          console.log(`🔒 [VEHICLE API] Returning tire data for vehicle ${vehicleId}:`, {
            dimensions: `${dimensions.width}/${dimensions.height} R${dimensions.diameter}`,
            loadIndex: dimensions.loadIndex || '❌ MISSING',
            speedIndex: dimensions.speedIndex || '❌ MISSING',
            season: seasonName
          })
        }
      } catch (e) {
        console.error(`Error parsing ${seasonName} data:`, e)
      }
    }
    
    // If no dimensions found for selected season, return clear error
    // Do NOT use currentTires as fallback for season-specific searches
    if (!dimensions) {
      return NextResponse.json({ 
        success: false, 
        error: `Für dieses Fahrzeug sind keine ${seasonName} hinterlegt. Bitte ergänzen Sie die Reifendaten in der Fahrzeugverwaltung.`,
        missingSeasonData: true,
        selectedSeason: season,
        seasonName
      }, { status: 404 })
    }

    // Check for mixed tire setup from JSON data (hasDifferentSizes flag) - season specific
    let hasMixedTires = false
    let dimensionsFront = null
    let dimensionsRear = null

    // Check only the selected season's tire data for mixed setup
    let seasonTireJson = null
    if (season === 's') {
      seasonTireJson = vehicle.summerTires
    } else if (season === 'w') {
      seasonTireJson = vehicle.winterTires
    } else if (season === 'g') {
      seasonTireJson = vehicle.allSeasonTires
    }

    if (seasonTireJson) {
      try {
        const parsed = typeof seasonTireJson === 'string' ? JSON.parse(seasonTireJson) : seasonTireJson
        
        if (parsed.hasDifferentSizes && parsed.rearWidth && parsed.rearAspectRatio && parsed.rearDiameter) {
          // Front dimensions
          dimensionsFront = {
            width: parsed.width,
            height: parsed.aspectRatio,
            diameter: parsed.diameter,
            loadIndex: parsed.loadIndex?.toString(),
            speedIndex: parsed.speedIndex || parsed.speedRating,
            formatted: `${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`
          }
          
          // Rear dimensions
          dimensionsRear = {
            width: parsed.rearWidth,
            height: parsed.rearAspectRatio,
            diameter: parsed.rearDiameter,
            loadIndex: parsed.rearLoadIndex?.toString() || parsed.loadIndex?.toString(),
            speedIndex: parsed.rearSpeedIndex || parsed.speedIndex || parsed.speedRating,
            formatted: `${parsed.rearWidth}/${parsed.rearAspectRatio} R${parsed.rearDiameter}`
          }
          
          hasMixedTires = true
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
