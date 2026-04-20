import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { sendChatMessage, AdvisorContext, ChatMessage } from '@/lib/ai/geminiService'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  let body: { message?: string; chatHistory?: ChatMessage[]; vehicleId?: string; latitude?: number; longitude?: number; platform?: 'app' | 'web'; language?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, chatHistory, vehicleId, latitude, longitude, platform, language } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Rate limiting: max 200 chars per message
  const sanitizedMessage = message.trim().slice(0, 200)

  try {
    // ── Load vehicles for customer (prefer specific vehicleId if given) ──
    const customerId = user.customerId
    let vehicles: any[] = []

    if (customerId) {
      if (vehicleId) {
        // Load the specific vehicle the user is asking about
        const specific = await prisma.vehicle.findFirst({
          where: { id: vehicleId, customerId },
        })
        if (specific) vehicles = [specific]
      }
      // Fallback: load all vehicles if no specific one found
      if (vehicles.length === 0) {
        vehicles = await prisma.vehicle.findMany({
          where: { customerId },
          orderBy: { updatedAt: 'desc' },
        })
      }
    }

    // ── Build tire sizes from ALL vehicles (including rear for mixed tires) ──
    const tireSizes: Set<string> = new Set()
    // Speed rating rank for comparison (higher = faster)
    const speedRatingRank: Record<string, number> = {
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 6, 'Q': 7, 'R': 8,
      'S': 9, 'T': 10, 'U': 11, 'H': 12, 'V': 13, 'W': 14, 'Y': 15, 'Z': 16,
    }

    // Track primary vehicle's loadIndex and speedIndex for filtering
    let primaryLoadIndex: number | null = null
    let primarySpeedRating: string | null = null

    const vehicleContexts: AdvisorContext['vehicles'] = vehicles.map((v, idx) => {
      let tireSize = ''
      let rearTireSize = ''
      const specs = v.summerTires || v.winterTires || v.allSeasonTires
      if (specs) {
        try {
          const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs
          if (parsed.width && parsed.aspectRatio && parsed.diameter) {
            tireSize = `${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`
            tireSizes.add(tireSize)
          }
          // Mixed tires (Mischbereifung): extract rear axle dimensions
          if (parsed.hasDifferentSizes && parsed.rearWidth && parsed.rearAspectRatio && parsed.rearDiameter) {
            rearTireSize = `${parsed.rearWidth}/${parsed.rearAspectRatio} R${parsed.rearDiameter}`
            tireSizes.add(rearTireSize)
          }
          // Capture loadIndex and speedRating from first vehicle
          if (idx === 0) {
            if (parsed.loadIndex) primaryLoadIndex = Number(parsed.loadIndex)
            if (parsed.speedRating) primarySpeedRating = String(parsed.speedRating).toUpperCase()
          }
        } catch { /* ignore parse errors */ }
      }
      return {
        make: v.make,
        model: v.model,
        year: v.year?.toString(),
        plate: v.licensePlate || undefined,
        tireSize: tireSize || undefined,
        rearTireSize: rearTireSize || undefined,
        fuelType: v.fuelType || undefined,
      }
    })

    // ── Load available tires from catalog for ALL sizes ──
    const topBrands = ['Continental', 'Michelin', 'Bridgestone', 'Goodyear', 'Pirelli', 'Dunlop', 'Hankook', 'Nokian', 'Vredestein', 'Falken', 'Kumho', 'Yokohama', 'Toyo', 'Nexen', 'Firestone', 'Semperit', 'Uniroyal', 'BFGoodrich', 'Maxxis']
    let availableTires: AdvisorContext['availableTires'] = []
    const rawTiresMap = new Map<string, { brand: string; model: string; size: string; width: string; height: string; diameter: string; season: string; loadIndex: string; speedIndex: string; labelFuelEfficiency: string; labelWetGrip: string; labelNoise: number; articleId: string }>()
    for (const tireSize of Array.from(tireSizes)) {
      try {
        const parts = tireSize.match(/(\d+)\/(\d+)\s*R(\d+)/)
        if (parts) {
          // First get known premium/mid brands
          const premiumTires = await prisma.tireCatalog.findMany({
            where: {
              width: parts[1],
              height: parts[2],
              diameter: parts[3],
              isActive: true,
              brand: { in: topBrands },
            },
            take: 30,
          })
          // Deduplicate by brand+model (allow multiple models per brand)
          const seen = new Set<string>()
          const dedupedTires = premiumTires.filter(t => {
            const key = `${t.brand}|${t.model || ''}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          availableTires.push(...dedupedTires.map(t => ({
            brand: t.brand,
            model: t.model || '',
            size: `${t.width}/${t.height} R${t.diameter}`,
            season: t.season === 's' ? 'Sommer' : t.season === 'w' ? 'Winter' : 'Ganzjahr',
            loadIndex: t.loadIndex || '-',
            speedIndex: t.speedIndex || '-',
            wetGrip: t.labelWetGrip || '-',
            fuelEfficiency: t.labelFuelEfficiency || '-',
            noise: t.labelNoise ?? 0,
            inStock: true,
          })))
          // Track full tire data for post-processing
          dedupedTires.forEach(t => {
            const key = `${t.brand}|${t.model || ''}|${t.width}/${t.height}R${t.diameter}`
            if (!rawTiresMap.has(key)) {
              rawTiresMap.set(key, {
                brand: t.brand,
                model: t.model || '',
                size: `${t.width}/${t.height} R${t.diameter}`,
                width: t.width,
                height: t.height,
                diameter: t.diameter,
                season: t.season === 's' ? 'Sommer' : t.season === 'w' ? 'Winter' : 'Ganzjahr',
                loadIndex: t.loadIndex || '-',
                speedIndex: t.speedIndex || '-',
                labelFuelEfficiency: t.labelFuelEfficiency || '-',
                labelWetGrip: t.labelWetGrip || '-',
                labelNoise: t.labelNoise ?? 0,
                articleId: t.articleId,
              })
            }
          })
        }
      } catch (e) {
        console.error('Tire catalog lookup failed:', e)
      }
    }

    // ── Load nearby workshops ──
    let workshops: AdvisorContext['workshops'] = []
    if (latitude && longitude) {
      try {
        const allWorkshops = await prisma.workshop.findMany({
          where: { isVerified: true },
          select: {
            companyName: true,
            openingHours: true,
            latitude: true,
            longitude: true,
            user: { select: { city: true } },
            reviews: { select: { rating: true } },
          },
          take: 100,
        })

        const withDistance = allWorkshops
          .filter(w => w.latitude && w.longitude)
          .map(w => {
            const dist = haversineKm(latitude, longitude, w.latitude!, w.longitude!)
            const avgRating = w.reviews.length > 0
              ? w.reviews.reduce((sum, r) => sum + r.rating, 0) / w.reviews.length
              : 0
            return {
              name: w.companyName,
              city: w.user?.city || '',
              distance: Math.round(dist * 10) / 10,
              rating: Math.round(avgRating * 10) / 10,
              reviewCount: w.reviews.length,
              open: isWorkshopOpen(w.openingHours),
              hours: getWorkshopHours(w.openingHours),
            }
          })
          .filter(w => w.distance <= 30)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)

        workshops = withDistance
      } catch (e) {
        console.error('Workshop lookup failed:', e)
      }
    }

    // ── Load booking history ──
    let bookingHistory: AdvisorContext['bookingHistory'] = []
    if (customerId) {
      try {
        const bookings = await prisma.directBooking.findMany({
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            date: true,
            serviceType: true,
            tireBrand: true,
            tireModel: true,
            workshop: { select: { companyName: true } },
          },
        })
        bookingHistory = bookings.map(b => ({
          date: new Date(b.date).toLocaleDateString('de-DE'),
          service: formatServiceType(b.serviceType),
          workshopName: b.workshop.companyName,
          tireBrand: b.tireBrand || '',
          tireModel: b.tireModel || '',
        }))
      } catch (e) {
        console.error('Booking history lookup failed:', e)
      }
    }

    // ── Build context ──
    const context: AdvisorContext = {
      vehicles: vehicleContexts.length > 0 ? vehicleContexts : undefined,
      availableTires,
      workshops,
      bookingHistory,
      platform: platform || 'app',
      language: language || 'de',
    }

    // ── Send to Gemini ──
    const { response, updatedHistory } = await sendChatMessage(
      sanitizedMessage,
      chatHistory || [],
      context,
    )

    // ── Extract recommended tires from AI response (max 3 per axle) ──
    // Build a map of vehicle front/rear sizes for axle detection
    const singleVehicle = vehicles.length === 1 || !!vehicleId
    const vehicleSizeMap: Array<{ front: string; rear?: string }> = vehicleContexts
      .filter(vc => vc.tireSize)
      .map(vc => ({ front: vc.tireSize!, rear: vc.rearTireSize }))

    // Detect mixed tires: any vehicle has different front/rear sizes
    let hasMixedTires = false
    let frontTireSize = ''
    let rearTireSize = ''
    if (singleVehicle && vehicleContexts.length > 0) {
      const pv = vehicleContexts[0]
      if (pv.tireSize) frontTireSize = pv.tireSize
      if (pv.rearTireSize) {
        rearTireSize = pv.rearTireSize
        hasMixedTires = true
      }
    } else {
      // Multiple vehicles: check all for mixed tires
      for (const vc of vehicleContexts) {
        if (vc.rearTireSize) {
          hasMixedTires = true
          break
        }
      }
    }

    const recommendedTires: Array<{ brand: string; model: string; size: string; width: string; height: string; diameter: string; season: string; loadIndex: string; speedIndex: string; labelFuelEfficiency: string; labelWetGrip: string; labelNoise: number; articleId: string; axle?: 'front' | 'rear' }> = []
    if (rawTiresMap.size > 0) {
      // When single/specific vehicle: filter by size + load + speed
      // When multiple vehicles (no vehicleId): use ALL catalog tires as candidates
      const allCandidates = Array.from(rawTiresMap.values()).filter(tire => {
        if (!singleVehicle) return true // No filtering for multi-vehicle
        const primarySizes = new Set<string>()
        if (frontTireSize) primarySizes.add(frontTireSize)
        if (rearTireSize) primarySizes.add(rearTireSize)
        if (primarySizes.size > 0 && !primarySizes.has(tire.size)) return false
        if (primaryLoadIndex && tire.loadIndex !== '-') {
          const tireLoad = Number(tire.loadIndex)
          if (!isNaN(tireLoad) && tireLoad < primaryLoadIndex) return false
        }
        if (primarySpeedRating && tire.speedIndex !== '-') {
          const vehicleRank = speedRatingRank[primarySpeedRating] ?? 0
          const tireRank = speedRatingRank[tire.speedIndex.toUpperCase()] ?? 0
          if (tireRank > 0 && vehicleRank > 0 && tireRank < vehicleRank) return false
        }
        return true
      })

      // Normalize response: remove markdown bold, extra whitespace
      const responseLC = response.toLowerCase().replace(/\*\*/g, '').replace(/\s+/g, ' ')
      console.log(`[AI-TIRES] candidates=${allCandidates.length}, rawMap=${rawTiresMap.size}, singleVehicle=${singleVehicle}, hasMixed=${hasMixedTires}`)
      if (allCandidates.length > 0) {
        console.log(`[AI-TIRES] Sample candidates: ${allCandidates.slice(0, 5).map(t => `${t.brand} ${t.model} (${t.size})`).join(' | ')}`)
        console.log(`[AI-TIRES] Response (first 300): ${responseLC.substring(0, 300)}`)
      }

      // Multi-pass matching function
      const extractMatches = (candidates: typeof allCandidates, axle: 'front' | 'rear' | undefined, max: number) => {
        const matched: typeof recommendedTires = []
        const matchedKeys = new Set<string>()

        // Pass 1: strict match (brand AND full model name in response)
        candidates.forEach(tire => {
          if (matched.length >= max) return
          if (tire.model && responseLC.includes(tire.brand.toLowerCase()) && responseLC.includes(tire.model.toLowerCase())) {
            matched.push({ ...tire, ...(axle ? { axle } : {}) })
            matchedKeys.add(`${tire.brand}|${tire.model}`)
          }
        })
        console.log(`[AI-TIRES] Pass1 (exact): ${matched.length} matches${axle ? ` [${axle}]` : ''}`)

        // Pass 2: brand + first two words of model
        if (matched.length < max) {
          candidates.forEach(tire => {
            if (matched.length >= max) return
            const key = `${tire.brand}|${tire.model}`
            if (matchedKeys.has(key)) return
            if (!tire.model) return
            const modelWords = tire.model.split(/\s+/)
            if (modelWords.length >= 2) {
              const firstTwoWords = modelWords.slice(0, 2).join(' ').toLowerCase()
              if (responseLC.includes(tire.brand.toLowerCase()) && responseLC.includes(firstTwoWords)) {
                matched.push({ ...tire, ...(axle ? { axle } : {}) })
                matchedKeys.add(key)
              }
            }
          })
          console.log(`[AI-TIRES] Pass2 (2words): ${matched.length} matches`)
        }

        // Pass 3: brand + first word of model (≥4 chars)
        if (matched.length < max) {
          candidates.forEach(tire => {
            if (matched.length >= max) return
            const key = `${tire.brand}|${tire.model}`
            if (matchedKeys.has(key)) return
            if (!tire.model) return
            const firstWord = tire.model.split(/\s+/)[0].toLowerCase()
            if (firstWord.length >= 4 && responseLC.includes(tire.brand.toLowerCase()) && responseLC.includes(firstWord)) {
              matched.push({ ...tire, ...(axle ? { axle } : {}) })
              matchedKeys.add(key)
            }
          })
          console.log(`[AI-TIRES] Pass3 (1word): ${matched.length} matches`)
        }

        // Pass 4: brand-only fallback
        if (matched.length < max) {
          const mentionedBrands = new Set<string>()
          candidates.forEach(tire => {
            if (responseLC.includes(tire.brand.toLowerCase())) {
              mentionedBrands.add(tire.brand)
            }
          })
          mentionedBrands.forEach(brand => {
            if (matched.length >= max) return
            const brandTire = candidates.find(t => t.brand === brand && !matchedKeys.has(`${t.brand}|${t.model}`))
            if (brandTire) {
              matched.push({ ...brandTire, ...(axle ? { axle } : {}) })
              matchedKeys.add(`${brandTire.brand}|${brandTire.model}`)
            }
          })
          console.log(`[AI-TIRES] Pass4 (brand): ${matched.length} matches (brands: ${[...mentionedBrands].join(', ')})`)
        }

        return matched
      }

      if (hasMixedTires && singleVehicle) {
        // Single vehicle with mixed tires: split by front/rear size
        const frontCandidates = allCandidates.filter(t => t.size === frontTireSize)
        const rearCandidates = allCandidates.filter(t => t.size === rearTireSize)
        console.log(`[AI-TIRES] Mixed single: front=${frontCandidates.length}, rear=${rearCandidates.length}`)
        recommendedTires.push(...extractMatches(frontCandidates, 'front', 3))
        recommendedTires.push(...extractMatches(rearCandidates, 'rear', 3))
      } else if (hasMixedTires) {
        // Multiple vehicles, some with mixed tires: match first, then assign axle from tire size
        const matched = extractMatches(allCandidates, undefined, 6)
        // Post-hoc axle assignment: check each matched tire's size against vehicle size map
        matched.forEach(tire => {
          for (const vs of vehicleSizeMap) {
            if (vs.rear) {
              if (tire.size === vs.front) { tire.axle = 'front'; return }
              if (tire.size === vs.rear) { tire.axle = 'rear'; return }
            }
          }
        })
        // Detect if final result actually has mixed tires
        const hasFront = matched.some(t => t.axle === 'front')
        const hasRear = matched.some(t => t.axle === 'rear')
        if (!hasFront || !hasRear) {
          // Not actually mixed → clear axle assignments
          matched.forEach(t => { delete t.axle })
          hasMixedTires = false
        }
        recommendedTires.push(...matched)
      } else {
        recommendedTires.push(...extractMatches(allCandidates, undefined, 3))
      }
      console.log(`[AI-TIRES] Final: ${recommendedTires.length} tires → ${recommendedTires.map(t => `${t.brand} ${t.model} [${t.axle || 'std'}]`).join(' | ')}`)
    }

    // Determine which vehicle the AI is discussing
    let resolvedVehicleId: string | undefined
    if (vehicleId) {
      resolvedVehicleId = vehicleId
    } else if (vehicles.length === 1) {
      resolvedVehicleId = vehicles[0].id
    } else if (hasMixedTires && recommendedTires.length > 0) {
      // Try to match recommended tire dimensions to a specific vehicle
      const frontRec = recommendedTires.find(t => t.axle === 'front')
      const rearRec = recommendedTires.find(t => t.axle === 'rear')
      if (frontRec && rearRec) {
        for (const v of vehicles) {
          const specs = v.summerTires || v.winterTires || v.allSeasonTires
          if (specs) {
            try {
              const p = typeof specs === 'string' ? JSON.parse(specs) : specs
              if (p.hasDifferentSizes &&
                  String(p.width) === frontRec.width && String(p.diameter) === frontRec.diameter &&
                  String(p.rearWidth) === rearRec.width && String(p.rearDiameter) === rearRec.diameter) {
                resolvedVehicleId = v.id
                break
              }
            } catch { /* ignore */ }
          }
        }
      }
    }

    return NextResponse.json({
      response,
      chatHistory: updatedHistory,
      ...(recommendedTires.length > 0 && { recommendedTires }),
      ...(hasMixedTires && { hasMixedTires: true }),
      ...(resolvedVehicleId && { selectedVehicleId: resolvedVehicleId }),
    })

  } catch (error: any) {
    console.error('AI Chat Error:', error?.message || error)
    console.error('AI Chat Stack:', error?.stack)
    return NextResponse.json({
      response: 'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es nochmal.',
      chatHistory: chatHistory || [],
    })
  }
}

// ── Helpers ──

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isWorkshopOpen(openingHoursRaw: string | null): boolean {
  if (!openingHoursRaw) return false
  try {
    const hours = typeof openingHoursRaw === 'string' ? JSON.parse(openingHoursRaw) : openingHoursRaw
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const now = new Date()
    const dayKey = days[now.getDay()]
    const todayHours = hours[dayKey]
    if (!todayHours || todayHours === 'closed') return false
    const match = todayHours.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/)
    if (!match) return false
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const openMin = parseInt(match[1]) * 60 + parseInt(match[2])
    const closeMin = parseInt(match[3]) * 60 + parseInt(match[4])
    return nowMin >= openMin && nowMin < closeMin
  } catch {
    return false
  }
}

function getWorkshopHours(openingHoursRaw: string | null): string {
  if (!openingHoursRaw) return ''
  try {
    const hours = typeof openingHoursRaw === 'string' ? JSON.parse(openingHoursRaw) : openingHoursRaw
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayKey = days[new Date().getDay()]
    const todayHours = hours[dayKey]
    return todayHours === 'closed' ? 'Heute geschlossen' : (todayHours || '')
  } catch {
    return ''
  }
}

const SERVICE_LABELS: Record<string, string> = {
  TIRE_CHANGE: 'Reifenwechsel',
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_REPAIR: 'Reifenreparatur',
  MOTORCYCLE_TIRE: 'Motorrad-Reifen',
  ALIGNMENT_BOTH: 'Achsvermessung',
}

function formatServiceType(type: string): string {
  return SERVICE_LABELS[type] || type
}
