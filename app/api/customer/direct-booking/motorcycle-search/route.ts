import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findCheapestTire, findTireRecommendations, searchTires } from '@/lib/services/tireSearchService'

// Geocode German ZIP code or city to coordinates via Nominatim
async function geocodeLocation(zipCode: string | null, city: string | null): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = zipCode ? `${zipCode}, Germany` : `${city}, Germany`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=de`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Bereifung24-App/1.0' },
    })
    const data = await response.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (e) {
    console.error('Geocoding error:', e)
  }
  return null
}

/**
 * POST /api/customer/direct-booking/motorcycle-search
 * Search workshops for motorcycle tire services with direct booking
 * 
 * Body:
 * {
 *   packageTypes?: string[] ("front", "rear", "both"),
 *   radiusKm: number,
 *   customerLat: number,
 *   customerLon: number,
 *   includeTires: boolean,
 *   tireDimensionsFront?: { width, height, diameter, loadIndex?, speedIndex? },
 *   tireDimensionsRear?: { width, height, diameter, loadIndex?, speedIndex? },
 *   tireFilters?: { minPrice, maxPrice, quality, seasons, showDOTTires, etc. }
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   workshops: Array<{
 *     id, name, address, distance,
 *     rating, reviewCount,
 *     basePrice, totalPrice,
 *     tireFront?, tireRear?, tireFrontRecommendations?, tireRearRecommendations?
 *   }>
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      packageTypes = [], // Can include: "motorcycle_with_tire_purchase", "motorcycle_tire_installation_only", "front", "rear", "both"
      radiusKm,
      customerLat,
      customerLon,
      zipCode,
      city,
      includeTires = false,
      tireDimensionsFront,
      tireDimensionsRear,
      tireFilters,
      includeDisposal = true, // Default: include disposal fee
      forcedWorkshopId,
      forcedWorkshopSlug,
    } = body

    console.log('🏍️ [MOTORCYCLE-SEARCH] tireFilters received:', JSON.stringify(tireFilters))
    console.log('🏍️ [MOTORCYCLE-SEARCH] tireFilters?.construction:', tireFilters?.construction)
    console.log('🏍️ [MOTORCYCLE-SEARCH] includeTires:', includeTires)

    const isWorkshopFixedMode = !!forcedWorkshopId || !!forcedWorkshopSlug

    let effectiveCustomerLat = customerLat
    let effectiveCustomerLon = customerLon

    if (isWorkshopFixedMode) {
      if (!forcedWorkshopId || !forcedWorkshopSlug) {
        return NextResponse.json(
          { error: 'Fehlende Parameter für fixed mode: forcedWorkshopId und forcedWorkshopSlug erforderlich' },
          { status: 400 }
        )
      }

      const landingContext = await prisma.workshopLandingPage.findFirst({
        where: {
          slug: forcedWorkshopSlug,
          isActive: true,
          workshopId: forcedWorkshopId,
        },
        select: {
          workshop: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      })

      if (!landingContext) {
        return NextResponse.json(
          { error: 'Ungültiger Landingpage-Kontext für fixed mode' },
          { status: 403 }
        )
      }

      effectiveCustomerLat = landingContext.workshop.latitude
      effectiveCustomerLon = landingContext.workshop.longitude
    }
    
    // Extract service-art and tire selection from packageTypes
    const hasWithTirePurchase = packageTypes.includes('motorcycle_with_tire_purchase')
    const hasTireInstallationOnly = packageTypes.includes('motorcycle_tire_installation_only')
    
    // Determine actual includeTires based on service-art selection
    let actualIncludeTires = includeTires
    if (hasWithTirePurchase) {
      actualIncludeTires = true // Always include tires for "Mit Reifenkauf"
    } else if (hasTireInstallationOnly) {
      actualIncludeTires = false // No tire search for "Nur Montage"
    }
    
    // Extract tire positions (front/rear/both) - filter out service-art packages
    const tirePositions = packageTypes.filter((p: string) => ['front', 'rear', 'both'].includes(p))
    
    console.log('🏍️ [MOTORCYCLE-SEARCH] Received request:', {
      packageTypes,
      extractedPositions: tirePositions,
      hasWithTirePurchase,
      hasTireInstallationOnly,
      originalIncludeTires: includeTires,
      actualIncludeTires,
      radiusKm,
      includeDisposal,
      tireDimensionsFront,
      tireDimensionsRear,
    })

    // Geocode from zipCode/city if coordinates not provided
    if (effectiveCustomerLat === undefined || effectiveCustomerLon === undefined || effectiveCustomerLat === null || effectiveCustomerLon === null) {
      if (zipCode || city) {
        const geo = await geocodeLocation(zipCode, city)
        if (geo) {
          effectiveCustomerLat = geo.lat
          effectiveCustomerLon = geo.lng
        }
      }
    }

    // Validate location parameters
    if (effectiveCustomerLat === undefined || effectiveCustomerLon === undefined || effectiveCustomerLat === null || effectiveCustomerLon === null) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: customerLat, customerLon erforderlich' },
        { status: 400 }
      )
    }

    // Auto-correct includeTires if dimensions are missing
    const needsFront = tirePositions.includes('front') || tirePositions.includes('both')
    const needsRear = tirePositions.includes('rear') || tirePositions.includes('both')
    
    if (actualIncludeTires && ((needsFront && !tireDimensionsFront) || (needsRear && !tireDimensionsRear))) {
      console.log('⚠️ [MOTORCYCLE-SEARCH] includeTires=true but dimensions missing - searching without tires')
      actualIncludeTires = false
    }
    
    console.log('🔍 [MOTORCYCLE-SEARCH] Final search mode:', { 
      actualIncludeTires,
      needsFront,
      needsRear,
      hasFront: !!tireDimensionsFront,
      hasRear: !!tireDimensionsRear
    })

    // Find workshops with MOTORCYCLE_TIRE service in radius
    // Direct booking is available if service has active packages
    const workshops = await prisma.workshop.findMany({
      where: {
        ...(forcedWorkshopId ? { id: forcedWorkshopId } : {}),
        isVerified: true,
        // Nur Werkstätten mit Stripe-Konto anzeigen (Zahlungsabwicklung)
        stripeEnabled: true,
        stripeAccountId: { not: null },
        workshopServices: {
          some: {
            serviceType: 'MOTORCYCLE_TIRE',
            isActive: true
          }
        },
        // Nur Werkstätten mit Kalender-Anbindung anzeigen (verhindert Doppelbuchungen)
        // Entweder Werkstatt-Kalender ODER mindestens ein Mitarbeiter-Kalender verbunden
        OR: [
          { googleCalendarId: { not: null } },
          { employees: { some: { googleCalendarId: { not: null } } } },
        ],
      },
      include: {
        workshopServices: {
          where: {
            serviceType: 'MOTORCYCLE_TIRE',
            isActive: true
          },
          include: {
            servicePackages: {
              where: {
                isActive: true
              }
            }
          }
        },
        bookings: {
          select: {
            tireRating: true,
            review: {
              select: {
                rating: true
              }
            }
          }
        },
        user: {
          select: {
            email: true,
            phone: true,
            street: true,
            city: true,
            zipCode: true
          }
        },
        landingPage: {
          select: {
            heroImage: true,
          },
        },
      }
    })

    console.log(`🔍 [MOTORCYCLE-SEARCH] Found ${workshops.length} workshops with MOTORCYCLE_TIRE service`)

    // Calculate distance and filter by radius
    const workshopsWithDistance = workshops
      .map(workshop => {
        const service = workshop.workshopServices.find(s => s.serviceType === 'MOTORCYCLE_TIRE')
        if (!service) return null
        
        // Haversine formula for distance calculation
        const lat1 = effectiveCustomerLat
        const lon1 = effectiveCustomerLon
        const lat2 = workshop.latitude
        const lon2 = workshop.longitude
        
        if (lat2 === null || lon2 === null) {
          return null // Skip workshop without valid coordinates
        }
        
        const R = 6371 // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        // Calculate prices based on packages
        let totalPrice = 0
        let baseDuration = service.durationMinutes || 30
        
        // Get active packages
        const activePackages = service.servicePackages?.filter(pkg => pkg.isActive) || []
        
        console.log(`📦 [MOTORCYCLE-SEARCH] Workshop ${workshop.id} packages:`, {
          totalPackages: service.servicePackages?.length || 0,
          activePackages: activePackages.length,
          requestedPositions: tirePositions,
          includeDisposal,
          availablePackages: activePackages.map(p => ({ type: p.packageType, price: p.price, active: p.isActive }))
        })
        
        // Find base packages
        const frontPackage = activePackages.find(pkg => pkg.packageType === 'front')
        const rearPackage = activePackages.find(pkg => pkg.packageType === 'rear')
        const disposalPackage = activePackages.find(pkg => pkg.packageType === 'disposal')
        
        // Determine tire count
        const tireCount = tirePositions.includes('both') ? 2 : 1
        
        // Calculate montage price based on selected positions
        let montagePrice = 0
        if (tirePositions.includes('both')) {
          // Both tires: sum front + rear package prices (they may differ)
          const frontPrice = frontPackage ? Number(frontPackage.price) : 0
          const rearPrice = rearPackage ? Number(rearPackage.price) : 0
          montagePrice = frontPrice + rearPrice
          baseDuration = Math.max(frontPackage?.durationMinutes || 30, rearPackage?.durationMinutes || 30) * 2
          // Fallback: if one package missing, double the other
          if (montagePrice <= 0) {
            montagePrice = (frontPrice || rearPrice) * 2
          }
        } else if (tirePositions.includes('front') && frontPackage) {
          montagePrice = Number(frontPackage.price)
          baseDuration = frontPackage.durationMinutes
        } else if (tirePositions.includes('rear') && rearPackage) {
          montagePrice = Number(rearPackage.price)
          baseDuration = rearPackage.durationMinutes
        }
        
        // Fallback to service basePrice if no package found
        if (montagePrice <= 0) {
          const fallbackBase = service.basePrice ? Number(service.basePrice) : 0
          montagePrice = fallbackBase * tireCount
        }
        
        // Calculate disposal fee (if requested)
        let disposalPrice = 0
        if (includeDisposal && disposalPackage) {
          disposalPrice = Number(disposalPackage.price) * tireCount
        }
        
        // Total price
        totalPrice = montagePrice + disposalPrice
        
        // Duration already calculated above per position
        
        console.log(`✅ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} pricing:`, { 
          montagePrice,
          tireCount,
          disposalPrice: disposalPrice,
          totalPrice,
          duration: baseDuration,
          packages: {
            front: frontPackage?.price,
            rear: rearPackage?.price,
            disposal: disposalPackage?.price
          }
        })

        // Validate that we have a valid price
        if (totalPrice <= 0) {
          console.log(`❌ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} has invalid totalPrice (${totalPrice}), excluding`)
          return null
        }

        // Calculate rating
        const reviews = workshop.bookings.filter(b => b.tireRating || b.review)
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, b) => {
              // Extract rating from review object or use tireRating
              const reviewObj = b.review
              let rating = 0
              if (reviewObj && typeof reviewObj === 'object' && 'rating' in reviewObj) {
                rating = Number(reviewObj.rating)
              } else if (typeof b.tireRating === 'number') {
                rating = b.tireRating
              }
              return sum + rating
            }, 0) / reviews.length
          : 0

        return {
          id: workshop.id,
          name: workshop.companyName || 'Unbekannte Werkstatt',
          logoUrl: workshop.logoUrl || null,
          cardImageUrl: workshop.cardImageUrl || null,
          heroImage: workshop.landingPage?.heroImage || null,
          address: workshop.user.street || '',
          city: workshop.user.city || '',
          zipCode: workshop.user.zipCode || '',
          distance: Math.round(distance * 10) / 10,
          latitude: workshop.latitude,
          longitude: workshop.longitude,
          rating: avgRating > 0 ? Math.round(avgRating * 10) / 10 : null,
          reviewCount: reviews.length,
          openingHours: workshop.openingHours || '',
          basePrice: parseFloat(montagePrice.toFixed(2)), // Pure montage price without disposal
          totalPrice: parseFloat(totalPrice.toFixed(2)),
          disposalFeeApplied: parseFloat(disposalPrice.toFixed(2)),
          estimatedDuration: baseDuration,
          tireCount: tireCount,
          includedDisposal: includeDisposal && disposalPrice > 0,
          serviceData: {
            disposalFee: Number(disposalPackage?.price || service.disposalFee || 0),
            runFlatSurcharge: Number(service.runFlatSurcharge || 0),
          },
        }
      })
      .filter((w): w is NonNullable<typeof w> => w !== null)
      .filter(w => isWorkshopFixedMode || w.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)

    console.log(`📍 [MOTORCYCLE-SEARCH] ${workshopsWithDistance.length} workshops within ${radiusKm}km`)

    // Tire search (if requested)
    let workshopsWithTires: any[] = workshopsWithDistance

    if (actualIncludeTires && (tireDimensionsFront || tireDimensionsRear)) {
      const needsFrontTires = tirePositions.includes('front') || tirePositions.includes('both')
      const needsRearTires = tirePositions.includes('rear') || tirePositions.includes('both')
      
      console.log('🔍 [MOTORCYCLE-SEARCH] Starting tire search:', { needsFrontTires, needsRearTires })

      workshopsWithTires = await Promise.all(
        workshopsWithDistance.map(async (workshop) => {
          try {
            let totalTirePrice = 0
            let frontRec = null
            let rearRec = null
            let allFrontTires: any[] = []
            let allRearTires: any[] = []
            let availableFront = false
            let availableRear = false
            
            const disposalFee = workshop.serviceData?.disposalFee || 0
            const runFlatSurcharge = workshop.serviceData?.runFlatSurcharge || 0

            // Determine season filter
            const seasonFilter = tireFilters?.seasons?.[0] || 'all'
            
            // Search front tire
            if (needsFrontTires && tireDimensionsFront) {
              const { width: widthFront, height: heightFront, diameter: diameterFront, loadIndex, speedIndex } = tireDimensionsFront
              
              console.log(`🔍 [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - Searching FRONT tire: ${widthFront}/${heightFront} R${diameterFront}`)

              // Get recommendations (quantity = 1 for motorcycle front tire)
              const frontRecsResult = await findTireRecommendations(
                workshop.id,
                String(widthFront),
                String(heightFront),
                String(diameterFront),
                seasonFilter,
                'Motorrad', // vehicleType
                {
                  minPrice: tireFilters?.minPrice,
                  maxPrice: tireFilters?.maxPrice,
                  quality: tireFilters?.quality,
                  showDOTTires: tireFilters?.showDOTTires,
                  construction: tireFilters?.construction,
                  minLoadIndex: loadIndex,
                  minSpeedIndex: speedIndex,
                },
                1, // Quantity = 1 for front tire
                0, // Disposal fee not added to tire price
                0  // RunFlat surcharge handled separately
              )

              // Get all available tires
              allFrontTires = await searchTires({
                workshopId: workshop.id,
                width: String(widthFront),
                height: String(heightFront),
                diameter: String(diameterFront),
                season: seasonFilter,
                minStock: 1, // Only 1 needed
                sortBy: 'price',
                sortOrder: 'asc',
                minPrice: tireFilters?.minPrice,
                maxPrice: tireFilters?.maxPrice,
                quality: tireFilters?.quality,
                showDOTTires: tireFilters?.showDOTTires,
                construction: tireFilters?.construction,
                minLoadIndex: loadIndex,
                minSpeedIndex: speedIndex,
              })

              if (frontRecsResult.available && frontRecsResult.recommendations.length > 0) {
                frontRec = frontRecsResult.recommendations[0] // Use cheapest recommendation
                totalTirePrice += frontRec.totalPrice
                availableFront = true
                console.log(`✅ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - FRONT tire available: ${frontRec.tire.brand} ${frontRec.tire.model} @ €${frontRec.totalPrice}`)
              } else {
                console.log(`❌ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - No FRONT tires available`)
              }
            }
            
            // Search rear tire
            if (needsRearTires && tireDimensionsRear) {
              const { width: widthRear, height: heightRear, diameter: diameterRear, loadIndex, speedIndex } = tireDimensionsRear
              
              console.log(`🔍 [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - Searching REAR tire: ${widthRear}/${heightRear} R${diameterRear}`)

              // Get recommendations (quantity = 1 for motorcycle rear tire)
              const rearRecsResult = await findTireRecommendations(
                workshop.id,
                String(widthRear),
                String(heightRear),
                String(diameterRear),
                seasonFilter,
                'Motorrad',
                {
                  minPrice: tireFilters?.minPrice,
                  maxPrice: tireFilters?.maxPrice,
                  quality: tireFilters?.quality,
                  showDOTTires: tireFilters?.showDOTTires,
                  construction: tireFilters?.construction,
                  minLoadIndex: loadIndex,
                  minSpeedIndex: speedIndex,
                },
                1, // Quantity = 1 for rear tire
                0,
                0
              )

              // Get all available tires
              allRearTires = await searchTires({
                workshopId: workshop.id,
                width: String(widthRear),
                height: String(heightRear),
                diameter: String(diameterRear),
                season: seasonFilter,
                minStock: 1,
                sortBy: 'price',
                sortOrder: 'asc',
                minPrice: tireFilters?.minPrice,
                maxPrice: tireFilters?.maxPrice,
                quality: tireFilters?.quality,
                showDOTTires: tireFilters?.showDOTTires,
                construction: tireFilters?.construction,
                minLoadIndex: loadIndex,
                minSpeedIndex: speedIndex,
              })

              if (rearRecsResult.available && rearRecsResult.recommendations.length > 0) {
                rearRec = rearRecsResult.recommendations[0]
                totalTirePrice += rearRec.totalPrice
                availableRear = true
                console.log(`✅ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - REAR tire available: ${rearRec.tire.brand} ${rearRec.tire.model} @ €${rearRec.totalPrice}`)
              } else {
                console.log(`❌ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - No REAR tires available`)
              }
            }
            
            // Only include workshop if ALL requested tires are available
            const allRequiredTiresAvailable = 
              (!needsFrontTires || availableFront) && 
              (!needsRearTires || availableRear)
            
            if (!allRequiredTiresAvailable) {
              console.log(`❌ [MOTORCYCLE-SEARCH] Workshop ${workshop.id} - Not all required tires available, excluding`)
              return null
            }
            
            // Calculate disposal fees (per tire) - only if requested
            const tiresCount = (needsFrontTires ? 1 : 0) + (needsRearTires ? 1 : 0)
            const disposalFeeTotal = includeDisposal ? (disposalFee * tiresCount) : 0
            
            // Calculate new total price
            const newTotalPrice = workshop.basePrice + totalTirePrice + disposalFeeTotal

            // Prepare front tire recommendations (if available)
            let frontRecsResult = null
            if (needsFrontTires && tireDimensionsFront && availableFront) {
              frontRecsResult = await findTireRecommendations(
                workshop.id,
                String(tireDimensionsFront.width),
                String(tireDimensionsFront.height),
                String(tireDimensionsFront.diameter),
                seasonFilter,
                'Motorrad',
                {
                  minPrice: tireFilters?.minPrice,
                  maxPrice: tireFilters?.maxPrice,
                  quality: tireFilters?.quality,
                  showDOTTires: tireFilters?.showDOTTires,
                  construction: tireFilters?.construction,
                  minLoadIndex: tireDimensionsFront.loadIndex,
                  minSpeedIndex: tireDimensionsFront.speedIndex,
                },
                1,
                0,
                0
              )
            }

            // Prepare rear tire recommendations (if available)
            let rearRecsResult = null
            if (needsRearTires && tireDimensionsRear && availableRear) {
              rearRecsResult = await findTireRecommendations(
                workshop.id,
                String(tireDimensionsRear.width),
                String(tireDimensionsRear.height),
                String(tireDimensionsRear.diameter),
                seasonFilter,
                'Motorrad',
                {
                  minPrice: tireFilters?.minPrice,
                  maxPrice: tireFilters?.maxPrice,
                  quality: tireFilters?.quality,
                  showDOTTires: tireFilters?.showDOTTires,
                  construction: tireFilters?.construction,
                  minLoadIndex: tireDimensionsRear.loadIndex,
                  minSpeedIndex: tireDimensionsRear.speedIndex,
                },
                1,
                0,
                0
              )
            }

            return {
              ...workshop,
              tireAvailable: true,
              isMixedTires: true,
              tirePrice: totalTirePrice,
              ...(frontRec && frontRecsResult && {
                tireFront: {
                  brand: frontRec.tire.brand,
                  model: frontRec.tire.model,
                  pricePerTire: frontRec.pricePerTire,
                  totalPrice: frontRec.totalPrice,
                  quantity: 1,
                  dimensions: `${tireDimensionsFront.width}/${tireDimensionsFront.height} R${tireDimensionsFront.diameter}`
                },
                tireFrontRecommendations: [
                  // Top 3 recommendations
                  ...frontRecsResult.recommendations.map(rec => ({
                    label: rec.label,
                    tire: {
                      brand: rec.tire.brand,
                      model: rec.tire.model,
                      articleNumber: rec.tire.articleNumber,
                      ean: rec.tire.ean || null,
                      width: rec.tire.width || null,
                      height: rec.tire.height || null,
                      diameter: rec.tire.diameter || null,
                      construction: rec.tire.construction || null,
                      loadIndex: rec.tire.loadIndex || null,
                      speedIndex: rec.tire.speedIndex || null,
                      labelFuelEfficiency: rec.tire.labelFuelEfficiency || null,
                      labelWetGrip: rec.tire.labelWetGrip || null,
                      labelNoise: rec.tire.labelNoise || null,
                      threePMSF: rec.tire.threePMSF,
                      runFlat: rec.tire.runFlat,
                    },
                    pricePerTire: rec.pricePerTire,
                    totalPrice: rec.totalPrice,
                    quantity: rec.quantity,
                  })),
                  // All other tires
                  ...allFrontTires
                    .filter(tire => !frontRecsResult.recommendations.some(rec => rec.tire.id === tire.id))
                    .map(tire => ({
                      label: '',
                      tire: {
                        brand: tire.brand,
                        model: tire.model,
                        articleNumber: tire.articleNumber,
                        ean: tire.ean || null,
                        width: tire.width || null,
                        height: tire.height || null,
                        diameter: tire.diameter || null,
                        construction: tire.construction || null,
                        loadIndex: tire.loadIndex || null,
                        speedIndex: tire.speedIndex || null,
                        labelFuelEfficiency: tire.labelFuelEfficiency || null,
                        labelWetGrip: tire.labelWetGrip || null,
                        labelNoise: tire.labelNoise || null,
                        threePMSF: tire.threePMSF,
                        runFlat: tire.runFlat,
                      },
                      pricePerTire: tire.sellingPrice,
                      totalPrice: tire.sellingPrice,
                      quantity: 1,
                    }))
                ]
              }),
              ...(rearRec && rearRecsResult && {
                tireRear: {
                  brand: rearRec.tire.brand,
                  model: rearRec.tire.model,
                  pricePerTire: rearRec.pricePerTire,
                  totalPrice: rearRec.totalPrice,
                  quantity: 1,
                  dimensions: `${tireDimensionsRear.width}/${tireDimensionsRear.height} R${tireDimensionsRear.diameter}`
                },
                tireRearRecommendations: [
                  // Top 3 recommendations
                  ...rearRecsResult.recommendations.map(rec => ({
                    label: rec.label,
                    tire: {
                      brand: rec.tire.brand,
                      model: rec.tire.model,
                      articleNumber: rec.tire.articleNumber,
                      ean: rec.tire.ean || null,
                      width: rec.tire.width || null,
                      height: rec.tire.height || null,
                      diameter: rec.tire.diameter || null,
                      construction: rec.tire.construction || null,
                      loadIndex: rec.tire.loadIndex || null,
                      speedIndex: rec.tire.speedIndex || null,
                      labelFuelEfficiency: rec.tire.labelFuelEfficiency || null,
                      labelWetGrip: rec.tire.labelWetGrip || null,
                      labelNoise: rec.tire.labelNoise || null,
                      threePMSF: rec.tire.threePMSF,
                      runFlat: rec.tire.runFlat,
                    },
                    pricePerTire: rec.pricePerTire,
                    totalPrice: rec.totalPrice,
                    quantity: rec.quantity,
                  })),
                  // All other tires
                  ...allRearTires
                    .filter(tire => !rearRecsResult.recommendations.some(rec => rec.tire.id === tire.id))
                    .map(tire => ({
                      label: '',
                      tire: {
                        brand: tire.brand,
                        model: tire.model,
                        articleNumber: tire.articleNumber,
                        ean: tire.ean || null,
                        width: tire.width || null,
                        height: tire.height || null,
                        diameter: tire.diameter || null,
                        construction: tire.construction || null,
                        loadIndex: tire.loadIndex || null,
                        speedIndex: tire.speedIndex || null,
                        labelFuelEfficiency: tire.labelFuelEfficiency || null,
                        labelWetGrip: tire.labelWetGrip || null,
                        labelNoise: tire.labelNoise || null,
                        threePMSF: tire.threePMSF,
                        runFlat: tire.runFlat,
                      },
                      pricePerTire: tire.sellingPrice,
                      totalPrice: tire.sellingPrice,
                      quantity: 1,
                    }))
                ]
              }),
              tireQuantity: tiresCount,
              disposalFeeApplied: disposalFeeTotal,
              totalPrice: newTotalPrice,
            }
          } catch (error) {
            console.error(`❌ [MOTORCYCLE-SEARCH] Error fetching tires for workshop ${workshop.id}:`, error)
            return null
          }
        })
      )

      // Filter out workshops without tires
      workshopsWithTires = workshopsWithTires.filter((w): w is NonNullable<typeof w> => w !== null)
      
      console.log(`🏍️ [MOTORCYCLE-SEARCH] ${workshopsWithTires.length} workshops with available motorcycle tires`)
    }

    return NextResponse.json({
      success: true,
      workshops: workshopsWithTires
    })

  } catch (error: any) {
    console.error('❌ [MOTORCYCLE-SEARCH] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler bei der Motorrad-Reifensuche' },
      { status: 500 }
    )
  }
}
