import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

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

// POST /api/eprel/search - Search EPREL database for tires
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

    // Get EPREL API Key from database
    const apiKey = await getApiSetting('EPREL_API_KEY')
    
    if (!apiKey) {
      console.warn('EPREL_API_KEY not configured, using mock data')
      return NextResponse.json(generateMockTires(width, aspectRatio, diameter, season, limit))
    }

    try {
      // EPREL API Call
      const dimension = `${width}/${aspectRatio}R${diameter}`
      
      // EPREL API Endpoint (Example - needs to be verified with actual EPREL API docs)
      const eprelUrl = new URL('https://ec.europa.eu/product-registry/api/v1/tyres/search')
      eprelUrl.searchParams.append('dimension', dimension)
      if (season) {
        eprelUrl.searchParams.append('season', season)
      }
      eprelUrl.searchParams.append('limit', limit.toString())

      const response = await fetch(eprelUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('EPREL API Error:', response.status, response.statusText)
        // Fallback to mock data on error
        return NextResponse.json(generateMockTires(width, aspectRatio, diameter, season, limit))
      }

      const data = await response.json()
      
      // Transform EPREL response to our format
      const tires: EPRELTire[] = data.results?.map((tire: any) => ({
        id: tire.id || tire.productId,
        manufacturer: tire.supplierName || tire.manufacturer,
        model: tire.modelName || tire.model,
        dimension: `${width}/${aspectRatio} R${diameter}`,
        season: mapEPRELSeasonToOurs(tire.season),
        wetGripClass: tire.wetGripClass || 'C',
        fuelEfficiency: tire.fuelEfficiency || 'C',
        noiseLevel: tire.externalRollingNoiseLevel || 70,
        noiseClass: tire.externalRollingNoiseClass || 'B',
        has3PMSF: tire.has3PMSF || false,
        price: undefined // EPREL doesn't provide prices
      })) || []

      return NextResponse.json(tires)

    } catch (apiError) {
      console.error('Error calling EPREL API:', apiError)
      // Fallback to mock data
      return NextResponse.json(generateMockTires(width, aspectRatio, diameter, season, limit))
    }

  } catch (error) {
    console.error('Error in EPREL search:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Reifensuche' },
      { status: 500 }
    )
  }
}

// Helper: Map EPREL season codes to our format
function mapEPRELSeasonToOurs(eprelSeason: string): 'SUMMER' | 'WINTER' | 'ALL_SEASON' {
  const seasonMap: Record<string, 'SUMMER' | 'WINTER' | 'ALL_SEASON'> = {
    'summer': 'SUMMER',
    'winter': 'WINTER',
    'all-season': 'ALL_SEASON',
    'all_season': 'ALL_SEASON',
    'allseason': 'ALL_SEASON'
  }
  return seasonMap[eprelSeason?.toLowerCase()] || 'SUMMER'
}

// Generate realistic mock data when EPREL is not available
function generateMockTires(
  width: number,
  aspectRatio: number,
  diameter: number,
  season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON',
  limit: number = 10
): EPRELTire[] {
  const dimension = `${width}/${aspectRatio} R${diameter}`
  
  const manufacturers = ['Continental', 'Michelin', 'Bridgestone', 'Goodyear', 'Pirelli', 'Dunlop', 'Hankook', 'Nokian']
  
  const summerModels = ['EcoContact 6', 'PremiumContact 6', 'Energy Saver+', 'Pilot Sport 4', 'Turanza T005', 'EfficientGrip Performance', 'Cinturato P7', 'BluEarth-GT AE51']
  const winterModels = ['WinterContact TS870', 'Alpin 6', 'Blizzak LM005', 'UltraGrip Performance+', 'Winter Sottozero 3', 'Winter Sport 5', 'Winter i*cept evo3', 'Hakkapeliitta R3']
  const allSeasonModels = ['AllSeasonContact', 'CrossClimate 2', 'Weather Control A005', 'Vector 4Seasons Gen-3', 'Cinturato All Season SF2', 'All Season Expert 2', 'Kinergy 4S2', 'Weatherproof']
  
  const grades = ['A', 'B', 'C', 'D', 'E']
  
  const tires: EPRELTire[] = []
  
  const targetSeason = season || 'SUMMER'
  const models = targetSeason === 'SUMMER' ? summerModels : targetSeason === 'WINTER' ? winterModels : allSeasonModels
  
  for (let i = 0; i < Math.min(limit, models.length); i++) {
    const manufacturer = manufacturers[i % manufacturers.length]
    const model = models[i]
    
    tires.push({
      id: `mock-${targetSeason}-${i}`,
      manufacturer,
      model,
      dimension,
      season: targetSeason,
      wetGripClass: grades[Math.floor(Math.random() * 3)], // A, B, or C
      fuelEfficiency: grades[Math.floor(Math.random() * 3)], // A, B, or C
      noiseLevel: 67 + Math.floor(Math.random() * 5), // 67-71 dB
      noiseClass: ['A', 'B'][Math.floor(Math.random() * 2)],
      has3PMSF: targetSeason === 'WINTER' || targetSeason === 'ALL_SEASON',
      price: 79.99 + Math.floor(Math.random() * 50) // 79.99 - 129.99€
    })
  }
  
  return tires
}
