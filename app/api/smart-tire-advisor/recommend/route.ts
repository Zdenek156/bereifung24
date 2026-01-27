import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface UserProfile {
  // Stufe 1: Fahrzeug
  width: number
  aspectRatio: number
  diameter: number
  vehicleType: 'small' | 'medium' | 'premium' | 'suv' | 'van'
  kmPerYear: number
  
  // Stufe 2: Nutzung
  usageCity: number // 0-100%
  usageLandroad: number // 0-100%
  usageHighway: number // 0-100%
  drivingStyle: 'sporty' | 'normal' | 'comfort'
  isElectric?: boolean
  
  // Stufe 3: Prioritäten (Summe = 100)
  prioritySafety: number // Nasshaftung
  priorityFuelSaving: number // Rollwiderstand
  priorityQuietness: number // Geräusch
  priorityDurability: number // Langlebigkeit
  priorityValue: number // Preis-Leistung
  
  // Stufe 4: Saison & Extras
  season: 'summer' | 'winter' | 'all-season'
  needs3PMSF?: boolean
  needsIceGrip?: boolean
}

interface ScoredTire {
  tire: any
  score: number
  scoreBreakdown: {
    euLabel: number
    seasonMatch: number
    brandReputation: number
    usageMatch: number
    drivingStyleMatch: number
  }
  reasons: string[]
  warnings: string[]
}

// Premium Marken
const PREMIUM_BRANDS = ['MICHELIN', 'CONTINENTAL', 'PIRELLI', 'GOODYEAR', 'BRIDGESTONE', 'DUNLOP']
const MID_RANGE_BRANDS = ['HANKOOK', 'NOKIAN', 'VREDESTEIN', 'FALKEN', 'KUMHO', 'NEXEN', 'TOYO']

// EU-Label zu Punkten
function labelToPoints(label: string | null): number {
  if (!label) return 0
  const map: Record<string, number> = { 'A': 10, 'B': 8, 'C': 6, 'D': 4, 'E': 2 }
  return map[label.toUpperCase()] || 0
}

// Geräuschpegel zu Punkten (70dB = gut, 75dB = schlecht)
function noiseToPoints(noise: number | null): number {
  if (!noise) return 5
  if (noise < 68) return 10
  if (noise < 70) return 8
  if (noise < 72) return 6
  if (noise < 74) return 4
  return 2
}

function calculateTireScore(tire: any, profile: UserProfile): ScoredTire {
  let score = 0
  const reasons: string[] = []
  const warnings: string[] = []
  const breakdown = {
    euLabel: 0,
    seasonMatch: 0,
    brandReputation: 0,
    usageMatch: 0,
    drivingStyleMatch: 0
  }
  
  // 1. EU-Label Bewertung (max 40 Punkte)
  const fuelPoints = labelToPoints(tire.fuelEfficiencyClass)
  const wetPoints = labelToPoints(tire.wetGripClass)
  const noisePoints = noiseToPoints(tire.externalRollingNoiseLevel)
  
  const fuelScore = fuelPoints * (profile.priorityFuelSaving / 100) * 0.4
  const wetScore = wetPoints * (profile.prioritySafety / 100) * 0.4
  const noiseScore = noisePoints * (profile.priorityQuietness / 100) * 0.2
  
  breakdown.euLabel = Math.round(fuelScore + wetScore + noiseScore)
  score += breakdown.euLabel
  
  if (tire.fuelEfficiencyClass === 'A') {
    reasons.push(`Beste Kraftstoffeffizienz (Klasse A)`)
  }
  if (tire.wetGripClass === 'A' || tire.wetGripClass === 'B') {
    reasons.push(`Hervorragende Nasshaftung (Klasse ${tire.wetGripClass})`)
  }
  if (tire.externalRollingNoiseLevel && tire.externalRollingNoiseLevel < 70) {
    reasons.push(`Sehr leise (${tire.externalRollingNoiseLevel} dB)`)
  }
  
  // 2. Saison-Match (max 25 Punkte)
  let seasonScore = 0
  if (profile.season === 'winter') {
    if (tire.has3PMSF) {
      seasonScore += 20
      reasons.push('Wintertauglich mit 3PMSF-Symbol')
    } else {
      warnings.push('Kein 3PMSF-Symbol für Winternutzung')
    }
    if (profile.needsIceGrip && tire.hasIceGrip) {
      seasonScore += 5
      reasons.push('Spezielle Eisgrip-Technologie')
    }
  } else if (profile.season === 'all-season') {
    if (tire.tyreClass === 'all-season') {
      seasonScore += 20
      reasons.push('Ganzjahresreifen - keine Reifenwechsel nötig')
    } else if (tire.has3PMSF) {
      seasonScore += 15
      warnings.push('Sommerreifen mit 3PMSF - besser als normale Sommerreifen im Winter')
    }
  } else if (profile.season === 'summer') {
    if (tire.tyreClass === 'summer') {
      seasonScore += 20
      reasons.push('Optimiert für Sommernutzung')
    } else if (tire.tyreClass === 'all-season') {
      seasonScore += 15
      warnings.push('Ganzjahresreifen - etwas weniger Performance als reine Sommerreifen')
    }
  }
  breakdown.seasonMatch = seasonScore
  score += seasonScore
  
  // 3. Marken-Reputation (max 15 Punkte)
  const brandUpper = tire.supplierName.toUpperCase()
  let brandScore = 0
  if (PREMIUM_BRANDS.includes(brandUpper)) {
    brandScore = 15
    reasons.push(`Premium-Marke ${tire.supplierName}`)
  } else if (MID_RANGE_BRANDS.includes(brandUpper)) {
    brandScore = 10
    reasons.push(`Bewährte Marke ${tire.supplierName}`)
  } else {
    brandScore = 5
  }
  
  // Bei hoher Kilometerleistung Premium bevorzugen
  if (profile.kmPerYear > 20000 && profile.priorityDurability > 30) {
    if (PREMIUM_BRANDS.includes(brandUpper)) {
      brandScore += 5
      reasons.push('Empfohlen für Vielfahrer')
    } else {
      warnings.push('Bei hoher Laufleistung könnten Premium-Reifen länger halten')
    }
  }
  
  breakdown.brandReputation = brandScore
  score += brandScore
  
  // 4. Nutzungsprofil-Match (max 10 Punkte)
  let usageScore = 0
  if (profile.usageHighway > 50) {
    // Autobahn-Vielfahrer
    if (tire.fuelEfficiencyClass === 'A' || tire.fuelEfficiencyClass === 'B') {
      usageScore += 5
      reasons.push('Niedriger Rollwiderstand spart Kraftstoff auf Langstrecke')
    }
    if (tire.externalRollingNoiseLevel && tire.externalRollingNoiseLevel < 70) {
      usageScore += 5
      reasons.push('Leise auf langen Autobahnfahrten')
    }
  } else if (profile.usageCity > 50) {
    // Stadt-Fahrer
    if (tire.wetGripClass === 'A' || tire.wetGripClass === 'B') {
      usageScore += 7
      reasons.push('Gute Nasshaftung wichtig für Stadt-Verkehr')
    }
    usageScore += 3 // Stadt-Reifen generell
  }
  breakdown.usageMatch = usageScore
  score += usageScore
  
  // 5. Fahrstil-Match (max 10 Punkte)
  let styleScore = 0
  if (profile.drivingStyle === 'sporty') {
    if ((tire.wetGripClass === 'A' || tire.wetGripClass === 'B') && 
        (tire.fuelEfficiencyClass === 'A' || tire.fuelEfficiencyClass === 'B')) {
      styleScore += 10
      reasons.push('Sportliche Performance bei hoher Sicherheit')
    } else {
      styleScore += 5
    }
  } else if (profile.drivingStyle === 'comfort') {
    if (tire.externalRollingNoiseLevel && tire.externalRollingNoiseLevel < 70) {
      styleScore += 10
      reasons.push('Sehr leise für komfortables Fahren')
    } else {
      styleScore += 5
    }
  } else {
    styleScore += 7 // Normal
  }
  breakdown.drivingStyleMatch = styleScore
  score += styleScore
  
  // Elektroauto-Bonus
  if (profile.isElectric && tire.fuelEfficiencyClass === 'A') {
    score += 5
    reasons.push('Niedriger Rollwiderstand erhöht Reichweite bei E-Autos')
  }
  
  return {
    tire,
    score: Math.round(score),
    scoreBreakdown: breakdown,
    reasons: reasons.slice(0, 3), // Top 3 Gründe
    warnings: warnings.slice(0, 2) // Max 2 Warnungen
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile: UserProfile = await request.json()
    
    // Validierung
    if (!profile.width || !profile.aspectRatio || !profile.diameter) {
      return NextResponse.json(
        { success: false, error: 'Reifendimension fehlt' },
        { status: 400 }
      )
    }
    
    // Prioritäten müssen Summe 100 ergeben
    const prioritySum = profile.prioritySafety + profile.priorityFuelSaving + 
                       profile.priorityQuietness + profile.priorityDurability + 
                       profile.priorityValue
    if (Math.abs(prioritySum - 100) > 1) {
      return NextResponse.json(
        { success: false, error: 'Prioritäten müssen Summe 100 ergeben' },
        { status: 400 }
      )
    }
    
    console.log('[SMART ADVISOR] Searching for tires:', {
      dimension: `${profile.width}/${profile.aspectRatio}R${profile.diameter}`,
      season: profile.season,
      kmPerYear: profile.kmPerYear
    })
    
    // Reifen aus EPREL DB holen
    const tires = await prisma.ePRELTire.findMany({
      where: {
        width: profile.width,
        aspectRatio: profile.aspectRatio,
        diameter: profile.diameter,
        // Optional: Saison-Filter
        ...(profile.season === 'winter' && profile.needs3PMSF ? { has3PMSF: true } : {}),
        ...(profile.needsIceGrip ? { hasIceGrip: true } : {})
      },
      select: {
        id: true,
        eprelId: true,
        supplierName: true,
        modelName: true,
        tyreDimension: true,
        width: true,
        aspectRatio: true,
        diameter: true,
        loadIndex: true,
        speedRating: true,
        tyreClass: true,
        has3PMSF: true,
        hasIceGrip: true,
        fuelEfficiencyClass: true,
        wetGripClass: true,
        externalRollingNoiseLevel: true,
        externalRollingNoiseClass: true
      }
    })
    
    if (tires.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Keine passenden Reifen gefunden',
        message: 'Für diese Reifengröße sind leider keine Daten in der EPREL-Datenbank verfügbar.'
      }, { status: 404 })
    }
    
    console.log(`[SMART ADVISOR] Found ${tires.length} tires, calculating scores...`)
    
    // Scoring für alle Reifen
    const scoredTires = tires.map(tire => calculateTireScore(tire, profile))
    
    // Nach Score sortieren und Top 10 nehmen
    scoredTires.sort((a, b) => b.score - a.score)
    const topRecommendations = scoredTires.slice(0, 10)
    
    console.log('[SMART ADVISOR] Top 3 scores:', 
      topRecommendations.slice(0, 3).map(t => `${t.tire.supplierName} ${t.tire.modelName}: ${t.score}`)
    )
    
    return NextResponse.json({
      success: true,
      recommendations: topRecommendations,
      totalFound: tires.length,
      profile: {
        dimension: `${profile.width}/${profile.aspectRatio}R${profile.diameter}`,
        season: profile.season,
        topPriority: Object.entries({
          safety: profile.prioritySafety,
          fuelSaving: profile.priorityFuelSaving,
          quietness: profile.priorityQuietness,
          durability: profile.priorityDurability,
          value: profile.priorityValue
        }).sort(([,a], [,b]) => b - a)[0][0]
      }
    })
    
  } catch (error) {
    console.error('Error in smart tire advisor:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler bei der Reifen-Empfehlung' },
      { status: 500 }
    )
  }
}
