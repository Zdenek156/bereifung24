import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface EPRELSearchParams {
  width: number
  aspectRatio: number
  diameter: number
  season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON'
  limit?: number
}

interface EPRELTire {
  id: string
  manufacturer: string
  model: string
  dimension: string
  season: 'SUMMER' | 'WINTER' | 'ALL_SEASON'
  wetGripClass: string
  fuelEfficiency: string
  noiseLevel: number
  noiseClass: string
  has3PMSF: boolean
  price?: number
}

// POST /api/eprel/search - Search EPREL database for tires (from local DB)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { width, aspectRatio, diameter, season, limit = 10 }: EPRELSearchParams = await req.json()

    if (!width || !aspectRatio || !diameter) {
      return NextResponse.json(
        { error: 'Breite, Querschnitt und Durchmesser sind erforderlich' },
        { status: 400 }
      )
    }

    console.log(`[EPREL Search] Searching for: ${width}/${aspectRatio}R${diameter} ${season || 'any season'}`)

    // Search in local database
    const whereClause: any = {
      width: width,
      aspectRatio: aspectRatio,
      diameter: diameter,
      isActive: true // Only search active tires
    }

    // Filter by season if specified
    if (season) {
      const seasonMapping: Record<string, string[]> = {
        'SUMMER': ['summer', 'c1', 'c2'],
        'WINTER': ['winter', 'c3'],
        'ALL_SEASON': ['all-season', 'all_season', 'allseason']
      }
      
      whereClause.tyreClass = {
        in: seasonMapping[season] || []
      }
    }

    const tires = await prisma.ePRELTire.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { supplierName: 'asc' },
        { modelName: 'asc' }
      ]
    })

    console.log(`[EPREL Search] Found ${tires.length} tires in database`)

    // Transform to API format
    const results: EPRELTire[] = tires.map((tire) => ({
      id: tire.id,
      manufacturer: tire.supplierName,
      model: tire.modelName,
      dimension: tire.tyreDimension,
      season: mapDBSeasonToOurs(tire.tyreClass || ''),
      wetGripClass: tire.wetGripClass || 'C',
      fuelEfficiency: tire.fuelEfficiencyClass || 'C',
      noiseLevel: tire.externalRollingNoiseLevel || 70,
      noiseClass: tire.externalRollingNoiseClass || 'B',
      has3PMSF: tire.has3PMSF,
      price: undefined // EPREL doesn't provide prices
    }))

    return NextResponse.json({
      results,
      total: results.length,
      source: 'eprel_db',
      note: results.length === 0 
        ? 'Keine passenden Reifen gefunden. Bitte EPREL-Daten importieren.' 
        : 'Daten aus lokaler EPREL-Datenbank'
    })

  } catch (error) {
    console.error('Error in EPREL search:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Reifensuche' },
      { status: 500 }
    )
  }
}

// Helper: Map DB season codes to our format
function mapDBSeasonToOurs(dbSeason: string): 'SUMMER' | 'WINTER' | 'ALL_SEASON' {
  const seasonLower = dbSeason.toLowerCase()
  
  if (seasonLower.includes('winter') || seasonLower === 'c3') {
    return 'WINTER'
  } else if (seasonLower.includes('all') || seasonLower.includes('season')) {
    return 'ALL_SEASON'
  }
  
  return 'SUMMER' // Default to summer (c1, c2, or summer)
}
