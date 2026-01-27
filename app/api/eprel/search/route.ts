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
      return NextResponse.json({
        error: 'EPREL API Key nicht konfiguriert',
        results: [],
        total: 0
      }, { status: 503 })
    }

    try {
      // EPREL API Endpoint - Correct format from EPREL support team
      // They confirmed: https://eprel.ec.europa.eu/api/exportProducts/tyres is the correct endpoint
      const eprelUrl = 'https://eprel.ec.europa.eu/api/exportProducts/tyres'

      console.log('Calling EPREL API:', eprelUrl)

      const response = await fetch(eprelUrl, {
        headers: {
          'X-Api-Key': apiKey,  // X-Api-Key as confirmed by EPREL support
          'Accept': 'application/json'
        }
      })

      console.log('EPREL API Response:', response.status, response.statusText)

      if (!response.ok) {
        console.error('EPREL API Error:', response.status, response.statusText)
        const errorText = await response.text().catch(() => 'Unknown error')
        return NextResponse.json({
          error: `EPREL API Fehler: ${response.status}`,
          details: errorText,
          results: [],
          total: 0
        }, { status: response.status })
      }

      const data = await response.json()
      
      console.log('EPREL API returned data:', Array.isArray(data) ? `${data.length} items` : typeof data)
      
      // EPREL returns array of all tyres, we need to filter
      const dimension = `${width}/${aspectRatio}R${diameter}`
      const allTires = Array.isArray(data) ? data : (data.results || [])
      
      // Filter by dimension and season
      const filteredTires = allTires
        .filter((tire: any) => {
          // Match dimension
          const tireDim = tire.tyreDimension || tire.dimension || ''
          if (!tireDim.includes(`${width}`) || !tireDim.includes(`${aspectRatio}`) || !tireDim.includes(`R${diameter}`)) {
            return false
          }
          // Match season if specified
          if (season) {
            const tireSeason = mapEPRELSeasonToOurs(tire.tyreClass || tire.season || '')
            if (tireSeason !== season) return false
          }
          return true
        })
        .slice(0, limit)
      
      // Transform EPREL response to our format
      const tires: EPRELTire[] = filteredTires.map((tire: any) => ({
        id: tire.id || tire.productId || `eprel-${Math.random()}`,
        manufacturer: tire.supplierName || tire.manufacturer || 'Unknown',
        model: tire.modelName || tire.commercialName || tire.model || 'Unknown Model',
        dimension: dimension,
        season: mapEPRELSeasonToOurs(tire.tyreClass || tire.season || ''),
        wetGripClass: tire.wetGripClass || tire.wetGrip || 'C',
        fuelEfficiency: tire.fuelEfficiencyClass || tire.rollingResistanceClass || 'C',
        noiseLevel: parseInt(tire.externalRollingNoiseLevel || tire.noiseLevel || '70'),
        noiseClass: tire.externalRollingNoiseClass || tire.noiseClass || 'B',
        has3PMSF: tire.hasSnowflake || tire.has3PMSF || tire.snowGrip || false,
        price: undefined // EPREL doesn't provide prices
      }))

      console.log(`Filtered ${tires.length} tires from EPREL data`)

      return NextResponse.json({
        results: tires,
        total: tires.length,
        source: 'eprel',
        note: tires.length === 0 ? 'Keine passenden Reifen gefunden' : 'Daten von EPREL EU-Datenbank'
      })

    } catch (apiError) {
      console.error('Error calling EPREL API:', apiError)
      return NextResponse.json({
        error: 'Fehler beim Abrufen der EPREL-Daten',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        results: [],
        total: 0
      }, { status: 500 })
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
