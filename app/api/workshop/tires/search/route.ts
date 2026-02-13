import { NextRequest, NextResponse } from 'next/server'
import { searchTires, findCheapestTire, getAvailableBrands } from '@/lib/services/tireSearchService'

/**
 * POST /api/workshop/tires/search
 * Search tires in workshop inventory with filters
 * 
 * Body:
 * {
 *   workshopId: string,
 *   width: string,
 *   height: string,
 *   diameter: string,
 *   season?: 's' | 'w' | 'g' | 'all',
 *   minStock?: number,
 *   maxPrice?: number,
 *   brands?: string[],
 *   minFuelEfficiency?: string,
 *   minWetGrip?: string,
 *   maxNoise?: number,
 *   runFlat?: boolean,
 *   threePMSF?: boolean,
 *   sortBy?: 'price' | 'brand' | 'fuel' | 'wetGrip' | 'noise',
 *   sortOrder?: 'asc' | 'desc'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      workshopId,
      width,
      height,
      diameter,
      season,
      minStock,
      maxPrice,
      brands,
      minFuelEfficiency,
      minWetGrip,
      maxNoise,
      runFlat,
      threePMSF,
      sortBy,
      sortOrder
    } = body

    // Validate required fields
    if (!workshopId || !width || !height || !diameter) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fehlende Parameter: workshopId, width, height, diameter erforderlich' 
        },
        { status: 400 }
      )
    }

    // Search tires
    const tires = await searchTires({
      workshopId,
      width,
      height,
      diameter,
      season,
      minStock,
      maxPrice,
      brands,
      minFuelEfficiency,
      minWetGrip,
      maxNoise,
      runFlat,
      threePMSF,
      sortBy,
      sortOrder
    })

    return NextResponse.json({
      success: true,
      tires,
      count: tires.length
    })
  } catch (error: any) {
    console.error('[TIRE-SEARCH-API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Fehler bei der Reifensuche' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workshop/tires/cheapest?workshopId=xxx&width=xxx&height=xxx&diameter=xxx&season=xxx&vehicleType=xxx
 * Find cheapest tire for a workshop (for search results)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const width = searchParams.get('width')
    const height = searchParams.get('height')
    const diameter = searchParams.get('diameter')
    const season = searchParams.get('season') as 's' | 'w' | 'g' | 'all' | null
    const vehicleType = (searchParams.get('vehicleType') || 'PKW') as 'PKW' | 'Motorrad'

    // Validate required fields
    if (!workshopId || !width || !height || !diameter) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Fehlende Parameter: workshopId, width, height, diameter erforderlich' 
        },
        { status: 400 }
      )
    }

    // Find cheapest tire
    const result = await findCheapestTire(
      workshopId,
      width,
      height,
      diameter,
      season || undefined,
      vehicleType
    )

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('[CHEAPEST-TIRE-API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Fehler bei der Reifensuche' },
      { status: 500 }
    )
  }
}
