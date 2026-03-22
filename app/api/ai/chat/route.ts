import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { sendChatMessage, AdvisorContext, ChatMessage } from '@/lib/ai/geminiService'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  let body: { message?: string; chatHistory?: ChatMessage[]; vehicleId?: string; latitude?: number; longitude?: number; platform?: 'app' | 'web' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, chatHistory, vehicleId, latitude, longitude, platform } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Rate limiting: max 200 chars per message
  const sanitizedMessage = message.trim().slice(0, 200)

  try {
    // ── Load ALL vehicles for customer ──
    const customerId = user.customerId
    let vehicles: any[] = []

    if (customerId) {
      vehicles = await prisma.vehicle.findMany({
        where: { customerId },
        orderBy: { updatedAt: 'desc' },
      })
    }

    // ── Build tire sizes from ALL vehicles ──
    const tireSizes: Set<string> = new Set()
    const vehicleContexts: AdvisorContext['vehicles'] = vehicles.map(v => {
      let tireSize = ''
      const specs = v.summerTires || v.winterTires || v.allSeasonTires
      if (specs) {
        try {
          const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs
          if (parsed.width && parsed.aspectRatio && parsed.diameter) {
            tireSize = `${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`
            tireSizes.add(tireSize)
          }
        } catch { /* ignore parse errors */ }
      }
      return {
        make: v.make,
        model: v.model,
        year: v.year?.toString(),
        plate: v.licensePlate || undefined,
        tireSize: tireSize || undefined,
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
            const key = `${t.brand}|${t.model || ''}`
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
    }

    // ── Send to Gemini ──
    const { response, updatedHistory } = await sendChatMessage(
      sanitizedMessage,
      chatHistory || [],
      context,
    )

    // ── Extract recommended tires from AI response (max 3) ──
    const recommendedTires: Array<{ brand: string; model: string; size: string; width: string; height: string; diameter: string; season: string; loadIndex: string; speedIndex: string; labelFuelEfficiency: string; labelWetGrip: string; labelNoise: number; articleId: string }> = []
    if (rawTiresMap.size > 0) {
      const responseLC = response.toLowerCase()
      // First pass: strict match (brand AND full model name)
      Array.from(rawTiresMap.values()).forEach(tire => {
        if (recommendedTires.length >= 3) return
        if (tire.model && responseLC.includes(tire.brand.toLowerCase()) && responseLC.includes(tire.model.toLowerCase())) {
          recommendedTires.push(tire)
        }
      })
      // Second pass: try matching brand + first word of model (for cases where AI abbreviates model names)
      if (recommendedTires.length < 3) {
        const matchedKeys = new Set(recommendedTires.map(t => `${t.brand}|${t.model}`))
        Array.from(rawTiresMap.values()).forEach(tire => {
          if (recommendedTires.length >= 3) return
          const key = `${tire.brand}|${tire.model}`
          if (matchedKeys.has(key)) return
          if (!tire.model) return
          const modelWords = tire.model.split(/\s+/)
          if (modelWords.length >= 2) {
            const firstTwoWords = modelWords.slice(0, 2).join(' ').toLowerCase()
            if (responseLC.includes(tire.brand.toLowerCase()) && responseLC.includes(firstTwoWords)) {
              recommendedTires.push(tire)
              matchedKeys.add(key)
            }
          }
        })
      }
    }

    return NextResponse.json({
      response,
      chatHistory: updatedHistory,
      ...(recommendedTires.length > 0 && { recommendedTires }),
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
