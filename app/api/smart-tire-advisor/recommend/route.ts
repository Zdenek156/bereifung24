import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface UserProfile {
  width: number
  aspectRatio: number
  diameter: number
  vehicleType: 'small' | 'medium' | 'premium' | 'suv' | 'van'
  kmPerYear: number
  usageCity: number
  usageLandroad: number
  usageHighway: number
  drivingStyle: 'sporty' | 'normal' | 'comfort'
  isElectric?: boolean
  prioritySafety: number
  priorityFuelSaving: number
  priorityQuietness: number
  priorityDurability: number
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

// ── Brand tiers ──
const PREMIUM_BRANDS = ['MICHELIN', 'CONTINENTAL', 'PIRELLI', 'GOODYEAR', 'BRIDGESTONE', 'DUNLOP']
const MID_RANGE_BRANDS = ['HANKOOK', 'NOKIAN', 'VREDESTEIN', 'FALKEN', 'KUMHO', 'NEXEN', 'TOYO', 'YOKOHAMA', 'COOPER', 'BF GOODRICH', 'FIRESTONE', 'GENERAL TIRE', 'UNIROYAL']

// ── Normalize EU label grade to 0-100 ──
function gradeScore(label: string | null): number {
  if (!label) return 25
  const map: Record<string, number> = { 'A': 100, 'B': 80, 'C': 60, 'D': 40, 'E': 20 }
  return map[label.toUpperCase()] ?? 25
}

// ── Normalize noise dB to 0-100 (64dB=100, 76dB=0, linear) ──
function noiseScore(db: number | null): number {
  if (!db) return 40
  return Math.max(0, Math.min(100, Math.round((76 - db) / 12 * 100)))
}

// ── Brand tier to score (0-100) ──
function brandTierScore(supplier: string): number {
  const name = (supplier || '').toUpperCase()
  if (PREMIUM_BRANDS.includes(name)) return 90
  if (MID_RANGE_BRANDS.includes(name)) return 65
  return 40
}

function calculateTireScore(tire: any, profile: UserProfile): ScoredTire {
  const reasons: string[] = []
  const warnings: string[] = []

  // ── 1. Raw dimension scores (each 0-100) ──
  const fuel  = gradeScore(tire.fuelEfficiencyClass)
  const wet   = gradeScore(tire.wetGripClass)
  const noise = noiseScore(tire.externalRollingNoiseLevel)
  const brand = brandTierScore(tire.supplierName)

  // ── 2. Build effective weights from user priorities + context ──
  // Start with the user's explicit priorities (sum = 100)
  let wFuel = profile.priorityFuelSaving
  let wWet  = profile.prioritySafety
  let wNoise = profile.priorityQuietness
  let wBrand = profile.priorityDurability

  // Usage context shifts (±5-10 pts, subtle but meaningful)
  if (profile.usageHighway > 55) {
    wFuel += 7; wNoise += 4; wWet -= 4
  } else if (profile.usageCity > 55) {
    wWet += 8; wNoise += 3; wFuel -= 4
  } else if (profile.usageLandroad > 45) {
    wWet += 4; wFuel += 3
  }

  // Driving style shifts
  if (profile.drivingStyle === 'sporty') {
    wWet += 7; wNoise -= 3
  } else if (profile.drivingStyle === 'comfort') {
    wNoise += 7; wWet -= 2
  }

  // EV modifier - range + cabin noise matter more
  if (profile.isElectric) {
    wFuel += 8; wNoise += 5
  }

  // Clamp negatives and normalize to sum = 100
  wFuel  = Math.max(wFuel, 0)
  wWet   = Math.max(wWet, 0)
  wNoise = Math.max(wNoise, 0)
  wBrand = Math.max(wBrand, 0)
  const wTotal = wFuel + wWet + wNoise + wBrand
  const nFuel  = wFuel / wTotal
  const nWet   = wWet / wTotal
  const nNoise = wNoise / wTotal
  const nBrand = wBrand / wTotal

  // ── 3. Cap brand influence at 20% max so data always dominates ──
  const brandCap = 0.20
  const effectiveBrandW = Math.min(nBrand, brandCap)
  const labelScale = (1 - effectiveBrandW) / (nFuel + nWet + nNoise || 1)
  const eFuel  = nFuel * labelScale
  const eWet   = nWet * labelScale
  const eNoise = nNoise * labelScale

  // ── 4. Composite score (0-100) ──
  const rawScore = fuel * eFuel + wet * eWet + noise * eNoise + brand * effectiveBrandW
  let finalScore = Math.round(rawScore)

  // ── 5. Season compliance bonus / penalty ──
  let seasonAdj = 0
  if (profile.season === 'winter') {
    if (!tire.has3PMSF) { seasonAdj = -15; warnings.push('Kein 3PMSF-Symbol') }
    else if (profile.needsIceGrip && !tire.hasIceGrip) { seasonAdj = -5; warnings.push('Kein Ice-Grip-Symbol') }
  } else if (profile.season === 'all-season') {
    if (tire.tyreClass !== 'all-season' && !tire.has3PMSF) { seasonAdj = -10; warnings.push('Nicht als Ganzjahresreifen zertifiziert') }
  }
  finalScore = Math.max(0, Math.min(100, finalScore + seasonAdj))

  // ── 6. Breakdown for transparency ──
  const breakdown = {
    euLabel: Math.round(fuel * eFuel + wet * eWet + noise * eNoise),
    seasonMatch: Math.max(0, -seasonAdj), // 0 = good match
    brandReputation: Math.round(brand * effectiveBrandW),
    usageMatch: Math.round((eFuel * fuel + eNoise * noise) * 0.1), // hint only
    drivingStyleMatch: Math.round((eWet * wet) * 0.1) // hint only
  }

  // ── 7. Smart reasons (max 3, relevance-ordered) ──
  type ReasonEntry = { text: string; weight: number }
  const candidateReasons: ReasonEntry[] = []

  // EU labels
  if (fuel >= 100) candidateReasons.push({ text: 'Kraftstoffeffizienz A – Bestwert', weight: eFuel * 100 })
  else if (fuel >= 80) candidateReasons.push({ text: `Kraftstoffeffizienz ${tire.fuelEfficiencyClass} – sehr gut`, weight: eFuel * 80 })
  
  if (wet >= 100) candidateReasons.push({ text: 'Nasshaftung A – kürzester Bremsweg', weight: eWet * 100 })
  else if (wet >= 80) candidateReasons.push({ text: `Nasshaftung ${tire.wetGripClass} – sehr gut`, weight: eWet * 80 })
  
  if (tire.externalRollingNoiseLevel && tire.externalRollingNoiseLevel < 69) {
    candidateReasons.push({ text: `Nur ${tire.externalRollingNoiseLevel} dB – besonders leise`, weight: eNoise * 90 })
  } else if (tire.externalRollingNoiseLevel && tire.externalRollingNoiseLevel < 71) {
    candidateReasons.push({ text: `${tire.externalRollingNoiseLevel} dB – leise`, weight: eNoise * 70 })
  }

  // Brand
  const brandUpper = (tire.supplierName || '').toUpperCase()
  if (PREMIUM_BRANDS.includes(brandUpper)) {
    candidateReasons.push({ text: `Premium-Marke ${tire.supplierName}`, weight: effectiveBrandW * 80 })
  } else if (MID_RANGE_BRANDS.includes(brandUpper)) {
    candidateReasons.push({ text: `Bewährte Marke ${tire.supplierName}`, weight: effectiveBrandW * 50 })
  }

  // Context-specific
  if (profile.isElectric && fuel >= 80) {
    candidateReasons.push({ text: 'Niedriger Rollwiderstand – mehr Reichweite', weight: 15 })
  }
  if (tire.has3PMSF && (profile.season === 'winter' || profile.season === 'all-season')) {
    candidateReasons.push({ text: 'Wintertauglich mit 3PMSF ❄️', weight: 20 })
  }
  if (tire.hasIceGrip) {
    candidateReasons.push({ text: 'Ice-Grip-Technologie 🧊', weight: 15 })
  }

  // Sort by relevance and take top 3
  candidateReasons.sort((a, b) => b.weight - a.weight)
  reasons.push(...candidateReasons.slice(0, 3).map(r => r.text))

  return {
    tire,
    score: finalScore,
    scoreBreakdown: breakdown,
    reasons,
    warnings: warnings.slice(0, 2)
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile: UserProfile = await request.json()

    if (!profile.width || !profile.aspectRatio || !profile.diameter) {
      return NextResponse.json(
        { success: false, error: 'Reifendimension fehlt' },
        { status: 400 }
      )
    }

    // Normalize priorities to sum=100 (be tolerant)
    const prioritySum = profile.prioritySafety + profile.priorityFuelSaving +
                       profile.priorityQuietness + profile.priorityDurability
    if (prioritySum > 0 && Math.abs(prioritySum - 100) > 1) {
      const f = 100 / prioritySum
      profile.prioritySafety = Math.round(profile.prioritySafety * f)
      profile.priorityFuelSaving = Math.round(profile.priorityFuelSaving * f)
      profile.priorityQuietness = Math.round(profile.priorityQuietness * f)
      profile.priorityDurability = 100 - profile.prioritySafety - profile.priorityFuelSaving - profile.priorityQuietness
    }

    // Fetch matching tires from EPREL DB
    const tires = await prisma.ePRELTire.findMany({
      where: {
        width: profile.width,
        aspectRatio: profile.aspectRatio,
        diameter: profile.diameter,
        ...(profile.season === 'winter' ? { has3PMSF: true } : {}),
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

    // Score all tires
    const scoredTires = tires.map(tire => calculateTireScore(tire, profile))

    // Deduplicate: keep best variant per brand+model
    const deduped = new Map<string, ScoredTire>()
    for (const scored of scoredTires) {
      const key = `${(scored.tire.supplierName || '').toUpperCase()}|${(scored.tire.modelName || '').toUpperCase()}`
      const existing = deduped.get(key)
      if (!existing || scored.score > existing.score) {
        deduped.set(key, scored)
      }
    }

    const uniqueTires = Array.from(deduped.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      recommendations: uniqueTires,
      totalFound: tires.length,
      uniqueModels: deduped.size,
      profile: {
        dimension: `${profile.width}/${profile.aspectRatio}R${profile.diameter}`,
        season: profile.season,
        topPriority: Object.entries({
          safety: profile.prioritySafety,
          fuelSaving: profile.priorityFuelSaving,
          quietness: profile.priorityQuietness,
          durability: profile.priorityDurability
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
