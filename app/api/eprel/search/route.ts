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
      const mockTires = generateMockTires(width, aspectRatio, diameter, season, limit)
      return NextResponse.json({
        results: mockTires,
        total: mockTires.length,
        source: 'mock_data',
        note: 'EPREL API Key nicht konfiguriert'
      })
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
        // Fallback to mock data
        const mockTires = generateMockTires(width, aspectRatio, diameter, season, limit)
        return NextResponse.json({
          results: mockTires,
          total: mockTires.length,
          source: 'mock_data',
          note: `EPREL API Error: ${response.status}`
        })
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

      if (tires.length === 0) {
        // No matching tires found, use mock data
        const mockTires = generateMockTires(width, aspectRatio, diameter, season, limit)
        return NextResponse.json({
          results: mockTires,
          total: mockTires.length,
          source: 'mock_data',
          note: 'Keine EPREL-Daten für diese Dimension gefunden'
        })
      }

      return NextResponse.json({
        results: tires,
        total: tires.length,
        source: 'eprel',
        note: 'Daten von EPREL EU-Datenbank'
      })

    } catch (apiError) {
      console.error('Error calling EPREL API:', apiError)
      // Fallback to mock data on error
      const mockTires = generateMockTires(width, aspectRatio, diameter, season, limit)
      return NextResponse.json({
        results: mockTires,
        total: mockTires.length,
        source: 'mock_data',
        note: 'EPREL API Fehler - Mock-Daten verwendet'
      })
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

// Generate comprehensive mock data until EPREL API is configured
function generateMockTires(
  width: number,
  aspectRatio: number,
  diameter: number,
  season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON',
  limit: number = 10
): EPRELTire[] {
  const dimension = `${width}/${aspectRatio} R${diameter}`
  
  // Expanded manufacturer list
  const manufacturers = [
    'Continental', 'Michelin', 'Bridgestone', 'Goodyear', 'Pirelli', 
    'Dunlop', 'Hankook', 'Nokian', 'Vredestein', 'Falken',
    'Kumho', 'Toyo', 'Yokohama', 'BFGoodrich', 'Uniroyal'
  ]
  
  // Expanded model lists with more variety
  const summerModels = [
    'EcoContact 6', 'PremiumContact 6', 'SportContact 5', 'ContiMaxContact MC6',
    'Energy Saver+', 'Pilot Sport 4', 'Primacy 4', 'e.Primacy',
    'Turanza T005', 'Potenza Sport', 'Ecopia EP500', 'DriveGuard',
    'EfficientGrip Performance', 'Eagle F1 Asymmetric 5', 'Vector 4Seasons',
    'Cinturato P7', 'P Zero', 'Scorpion Verde', 'Cinturato P7 Blue',
    'Sport Maxx RT', 'BluResponse', 'SP Sport Maxx GT',
    'Ventus S1 evo3', 'Kinergy eco', 'iON evo', 'Ventus Prime 3'
  ]
  
  const winterModels = [
    'WinterContact TS870', 'WinterContact TS860', 'VikingContact 7',
    'Alpin 6', 'X-Ice Snow', 'Pilot Alpin 5', 'Alpin 5',
    'Blizzak LM005', 'Blizzak LM001', 'Blizzak LM32', 'Blizzak WS90',
    'UltraGrip Performance+', 'UltraGrip 9+', 'UltraGrip Ice 2',
    'Winter Sottozero 3', 'Scorpion Winter', 'Cinturato Winter',
    'Winter Sport 5', 'SP Winter Sport 4D', 'Winter Response 2',
    'Winter i*cept evo3', 'Winter i*cept RS3', 'Winter i*Pike RS2',
    'Hakkapeliitta R3', 'Hakkapeliitta R5', 'WR D4', 'Snowprox S954'
  ]
  
  const allSeasonModels = [
    'AllSeasonContact', 'AllSeasonContact 2', 'CrossContact ATR',
    'CrossClimate 2', 'CrossClimate+', 'CrossClimate SUV',
    'Weather Control A005', 'WeatherReady', 'Turanza All Season 6',
    'Vector 4Seasons Gen-3', 'Vector 4Seasons G2', 'All Season Expert 2',
    'Cinturato All Season SF2', 'Scorpion Verde All Season', 'Cinturato All Season Plus',
    'All Season Expert', 'StreetResponse 2',
    'Kinergy 4S2', 'Kinergy 4S H740', 'Dynapro HP2',
    'Weatherproof', 'Seasonproof', 'Quatrac', 'Snowtrac 5'
  ]
  
  const grades = ['A', 'B', 'C', 'D', 'E']
  
  const tires: EPRELTire[] = []
  
  const targetSeason = season || 'SUMMER'
  const models = targetSeason === 'SUMMER' ? summerModels : targetSeason === 'WINTER' ? winterModels : allSeasonModels
  
  // Create more diverse tire options
  for (let i = 0; i < Math.min(limit, models.length); i++) {
    const manufacturer = manufacturers[i % manufacturers.length]
    const model = models[i]
    
    // Better variety in ratings
    const safetyFocus = i % 4 === 0
    const efficiencyFocus = i % 4 === 1
    const quietFocus = i % 4 === 2
    const balanced = i % 4 === 3
    
    let wetGrip, fuelEff, noise
    
    if (safetyFocus) {
      wetGrip = ['A', 'A', 'B'][Math.floor(Math.random() * 3)]
      fuelEff = ['B', 'C', 'C'][Math.floor(Math.random() * 3)]
      noise = 68 + Math.floor(Math.random() * 4)
    } else if (efficiencyFocus) {
      wetGrip = ['B', 'B', 'C'][Math.floor(Math.random() * 3)]
      fuelEff = ['A', 'A', 'B'][Math.floor(Math.random() * 3)]
      noise = 68 + Math.floor(Math.random() * 4)
    } else if (quietFocus) {
      wetGrip = ['B', 'C', 'C'][Math.floor(Math.random() * 3)]
      fuelEff = ['B', 'C', 'C'][Math.floor(Math.random() * 3)]
      noise = 66 + Math.floor(Math.random() * 2)
    } else {
      wetGrip = ['B', 'B', 'C'][Math.floor(Math.random() * 3)]
      fuelEff = ['B', 'B', 'C'][Math.floor(Math.random() * 3)]
      noise = 67 + Math.floor(Math.random() * 3)
    }
    
    tires.push({
      id: `mock-${targetSeason}-${i}`,
      manufacturer,
      model,
      dimension,
      season: targetSeason,
      wetGripClass: wetGrip,
      fuelEfficiency: fuelEff,
      noiseLevel: noise,
      noiseClass: noise <= 67 ? 'A' : 'B',
      has3PMSF: targetSeason === 'WINTER' || targetSeason === 'ALL_SEASON',
      price: 79.99 + Math.floor(Math.random() * 50) // 79.99 - 129.99€
    })
  }
  
  return tires
}
