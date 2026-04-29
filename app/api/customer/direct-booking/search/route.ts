import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findCheapestTire, findTireRecommendations, searchTires } from '@/lib/services/tireSearchService'

/**
 * POST /api/customer/direct-booking/search
 * Search workshops for direct booking services
 * 
 * Body:
 * {
 *   serviceType: string (WHEEL_CHANGE, TIRE_REPAIR, etc.),
 *   packageTypes?: string[] (filter by specific package types),
 *   radiusKm: number,
 *   customerLat: number,
 *   customerLon: number
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   workshops: Array<{
 *     id, name, address, distance,
 *     rating, reviewCount,
 *     openingHours,
 *     basePrice, totalPrice,
 *     estimatedDuration
 *   }>
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // No authentication required for public search
    // const session = await getServerSession(authOptions)

    const body = await request.json()
    const {
      serviceType = 'WHEEL_CHANGE',
      packageTypes = [], // Array of package types to filter
      radiusKm,
      customerLat,
      customerLon,
      zipCode,
      city,
      // Tire search parameters (optional)
      includeTires = false,
      tireDimensions,
      tireDimensionsFront, // For mixed tires: front axle dimensions
      tireDimensionsRear,  // For mixed tires: rear axle dimensions
      tireFilters,
      sameBrand = false, // For mixed 4 tires: require same brand for front and rear
      includeDisposal = true, // Default: include disposal fee
      forcedWorkshopId,
      forcedWorkshopSlug
    } = body
    
    console.log('ðŸ” [API] Received sameBrand parameter:', { sameBrand, type: typeof sameBrand })

    // Determine tire count from packageTypes (for tire pricing)
    // CRITICAL: Check mixed tire packages FIRST, but ONLY if dimensions are provided
    let requestedTireCount = 4 // Default
    let isMixedTires = false
    let frontTireCount = 0
    let rearTireCount = 0

    // Check if we have mixed tire dimensions
    const hasMixedDimensions = tireDimensionsFront && tireDimensionsRear

    if (packageTypes.includes('front_two_tires') && hasMixedDimensions) {
      requestedTireCount = 2
      isMixedTires = true
      frontTireCount = 2
    } else if (packageTypes.includes('rear_two_tires') && hasMixedDimensions) {
      requestedTireCount = 2
      isMixedTires = true
      rearTireCount = 2
    } else if (packageTypes.includes('mixed_four_tires') && hasMixedDimensions) {
      requestedTireCount = 4
      isMixedTires = true
      frontTireCount = 2
      rearTireCount = 2
    } else if (packageTypes.includes('two_tires')) {
      requestedTireCount = 2
    } else if (packageTypes.includes('four_tires')) {
      requestedTireCount = 4
    }
    console.log('ðŸ”¢ [API] Requested tire count:', requestedTireCount, 'isMixedTires:', isMixedTires, 'from packageTypes:', packageTypes)
    console.log('ðŸ” [API] Tire dimensions received:', { 
      includeTires, 
      tireDimensions, 
      tireDimensionsFront, 
      tireDimensionsRear 
    })

    const isWorkshopFixedMode = !!forcedWorkshopId || !!forcedWorkshopSlug

    let effectiveCustomerLat = customerLat
    let effectiveCustomerLon = customerLon

    if (isWorkshopFixedMode) {
      if (!forcedWorkshopId || !forcedWorkshopSlug) {
        return NextResponse.json(
          { error: 'Fehlende Parameter fÃ¼r fixed mode: forcedWorkshopId und forcedWorkshopSlug erforderlich' },
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
          { error: 'UngÃ¼ltiger Landingpage-Kontext fÃ¼r fixed mode' },
          { status: 403 }
        )
      }

      effectiveCustomerLat = landingContext.workshop.latitude
      effectiveCustomerLon = landingContext.workshop.longitude
    }

    // Validate location parameters only (vehicle not needed for search)
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

    if (effectiveCustomerLat === undefined || effectiveCustomerLon === undefined || effectiveCustomerLat === null || effectiveCustomerLon === null) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: customerLat, customerLon erforderlich' },
        { status: 400 }
      )
    }

    // Vehicle selection happens later in booking flow

    // Vehicle selection happens later in booking flow

    // Find workshops with selected service in radius
    // Direct booking is available if service has active packages
    const workshops = await prisma.workshop.findMany({
      where: {
        ...(forcedWorkshopId ? { id: forcedWorkshopId } : {}),
        isVerified: true,
        // Nur WerkstÃ¤tten mit Stripe-Konto anzeigen (Zahlungsabwicklung)
        stripeEnabled: true,
        stripeAccountId: { not: null },
        workshopServices: {
          some: {
            serviceType: serviceType,
            isActive: true
          }
        },
        // Nur WerkstÃ¤tten mit Kalender-Anbindung anzeigen (verhindert Doppelbuchungen)
        // Entweder Werkstatt-Kalender ODER mindestens ein Mitarbeiter-Kalender verbunden
        OR: [
          { googleCalendarId: { not: null } },
          { employees: { some: { googleCalendarId: { not: null } } } },
        ],
      },
      include: {
        workshopServices: {
          where: {
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
        tireChangePricing: {
          where: {
            isActive: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        landingPage: {
          select: {
            heroImage: true,
          },
        },
        bookings: {
          // Load ALL bookings, filter in code (Prisma nullable field limitations)
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
        }
      }
    })

    console.log(`ðŸ” [API] Found ${workshops.length} workshops with ${serviceType} service`)
    workshops.forEach(w => {
      const service = w.workshopServices.find(s => s.serviceType === serviceType)
      console.log(`  - ${w.companyName}: ${service ? service.servicePackages.length + ' packages' : 'NO SERVICE'}`)
    })

    // Determine RunFlat requirement early (needed for workshop filtering)
    const requireRunFlat = packageTypes.includes('runflat')
    // Determine Disposal requirement early (needed for workshop filtering)
    const requireDisposal = packageTypes.includes('with_disposal')

    // Calculate distance and filter by radius
    const workshopsWithDistance = workshops
      .map(workshop => {
        // Find the searched service
        const service = workshop.workshopServices.find(s => s.serviceType === serviceType)
        if (!service) return null // Skip workshops without the searched service
        
        // Filter: If customer searches "Nur Montage" (no tire purchase), skip workshops that don't accept mounting-only
        if (!includeTires && serviceType === 'TIRE_CHANGE' && service.acceptsMountingOnly === false) {
          console.log(`🚫 [${workshop.companyName}] Skipped: does not accept mounting-only (Nur Montage)`)
          return null
        }
        
        // Filter: If RunFlat is required, skip workshops without RunFlat surcharge
        if (requireRunFlat && serviceType === 'TIRE_CHANGE' && (!service.runFlatSurcharge || Number(service.runFlatSurcharge) <= 0)) {
          console.log(`🚫 [${workshop.companyName}] Skipped: no RunFlat surcharge configured`)
          return null
        }
        
        // Filter: If Disposal is required, skip workshops without disposal fee
        if (requireDisposal && serviceType === 'TIRE_CHANGE' && (!service.disposalFee || Number(service.disposalFee) <= 0)) {
          console.log(`🚫 [${workshop.companyName}] Skipped: no disposal fee configured (Entsorgung)`)
          return null
        }
        
        // Haversine formula for distance calculation
        const lat1 = effectiveCustomerLat
        const lon1 = effectiveCustomerLon
        const lat2 = workshop.latitude
        const lon2 = workshop.longitude
        
        const R = 6371 // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        // Calculate prices - Convert Decimal to Number
        // NEW LOGIC: Package prices are BASE prices (e.g., two_tires OR four_tires)
        // Additional fees (disposal, runflat) are added based on tire count
        let basePrice = 0
        let baseDuration = service.durationMinutes || 30
        let tireCount = 0 // For TIRE_CHANGE: 2 or 4
        
        // Separate main packages from additional services
        const mainPackageTypes = ['two_tires', 'four_tires', 'front_two_tires', 'rear_two_tires', 'mixed_four_tires', 
                                  'basic', 'with_balancing', 'with_storage', 'with_washing', 'complete',
                                   'measurement_front', 'measurement_rear', 'measurement_both',
                                   'adjustment_front', 'adjustment_rear', 'adjustment_both', 'full_service',
                                   'foreign_object', 'valve_damage', 'front', 'rear', 'both',
                                   'check', 'basic', 'comfort', 'premium']
        const additionalServices = ['with_disposal', 'runflat']
        
        // Get selected main package and additional services
        const selectedMainPackages = packageTypes.filter(pt => mainPackageTypes.includes(pt))
        const selectedAdditionalServices = packageTypes.filter(pt => additionalServices.includes(pt))
        
        // Map mixed tire packages to standard workshop packages
        // Mixed packages (front_two_tires, rear_two_tires, mixed_four_tires) are ONLY for tire search
        // Workshops only have two_tires and four_tires packages
        const mappedPackages = selectedMainPackages.map(pkg => {
          if (pkg === 'front_two_tires' || pkg === 'rear_two_tires') return 'two_tires'
          if (pkg === 'mixed_four_tires') return 'four_tires'
          return pkg
        })
        console.log('ðŸ”„ [API] Package mapping:', { original: selectedMainPackages, mapped: mappedPackages })
        
        // Filter packages by selected main package types
        let relevantPackages = service.servicePackages || []
        
        // Price breakdown for WHEEL_CHANGE (will be included in response)
        let wheelChangeBreakdown: { basePrice: number; balancingSurcharge: number; storageSurcharge: number; washingSurcharge: number } | null = null
        
        // Special handling for WHEEL_CHANGE with additive pricing (checkboxes)
        if (serviceType === 'WHEEL_CHANGE') {
          // Find required packages
          const basicPackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'basic')
          const balancingPackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'with_balancing')
          const storagePackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'with_storage')
          const washingPackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'with_washing')
          
          if (!basicPackage) {
            return null // Workshop must have basic package
          }
          
          // If no filters selected, return only basic package with its original price
          if (selectedMainPackages.length === 0) {
            relevantPackages = [basicPackage]
            wheelChangeBreakdown = { basePrice: Number(basicPackage.price), balancingSurcharge: 0, storageSurcharge: 0, washingSurcharge: 0 }
          } else {
            // Calculate additive price based on selected filters
            const hasBalancing = selectedMainPackages.includes('with_balancing')
            const hasStorage = selectedMainPackages.includes('with_storage')
            const hasWashing = selectedMainPackages.includes('with_washing')
            
            // Check if workshop offers selected options
            if (hasBalancing && !balancingPackage) {
              return null // User wants balancing but workshop doesn't offer it
            }
            if (hasStorage && !storagePackage) {
              return null // User wants storage but workshop doesn't offer it
            }
            if (hasWashing && !washingPackage) {
              return null // User wants washing but workshop doesn't offer it
            }
            
            // Calculate additive price: start with basic
            let totalPrice = Number(basicPackage.price)
            let totalDuration = basicPackage.durationMinutes
            let balancingSurchargeValue = 0
            let storageSurchargeValue = 0
            let washingSurchargeValue = 0
            
            // Add balancing surcharge if selected
            if (hasBalancing && balancingPackage) {
              const basicPrice = Number(basicPackage.price)
              const balancingFullPrice = Number(balancingPackage.price)
              balancingSurchargeValue = balancingFullPrice - basicPrice
              totalPrice += balancingSurchargeValue
              totalDuration = balancingPackage.durationMinutes
            }
            
            // Add storage surcharge if selected
            if (hasStorage && storagePackage) {
              const basicPrice = Number(basicPackage.price)
              const storageFullPrice = Number(storagePackage.price)
              storageSurchargeValue = storageFullPrice - basicPrice
              totalPrice += storageSurchargeValue
              if (storagePackage.durationMinutes > totalDuration) {
                totalDuration = storagePackage.durationMinutes
              }
            }
            
            // Add washing surcharge if selected
            if (hasWashing && washingPackage) {
              const basicPrice = Number(basicPackage.price)
              const washingFullPrice = Number(washingPackage.price)
              washingSurchargeValue = washingFullPrice - basicPrice
              totalPrice += washingSurchargeValue
              if (washingPackage.durationMinutes > totalDuration) {
                totalDuration = washingPackage.durationMinutes
              }
            }
            
            wheelChangeBreakdown = { basePrice: Number(basicPackage.price), balancingSurcharge: balancingSurchargeValue, storageSurcharge: storageSurchargeValue, washingSurcharge: washingSurchargeValue }
            
            // Use basic package as base but with calculated price
            relevantPackages = [{ ...basicPackage, price: totalPrice, durationMinutes: totalDuration }]
          }
        } else if (serviceType === 'TIRE_CHANGE') {
          // TIRE_CHANGE: Use rim-size pricing table instead of packages
          // Extract rim size from tire dimensions
          const rimSize = tireDimensions?.diameter 
            || tireDimensionsFront?.diameter 
            || body.rimSize 
            || null
          
          if (rimSize && workshop.tireChangePricing && workshop.tireChangePricing.length > 0) {
            const requestedSize = parseInt(rimSize)
            const pricing = workshop.tireChangePricing.find(p => p.rimSize === requestedSize)
            
            if (pricing) {
              // Determine tire count from filter (2 or 4)
              tireCount = requestedTireCount || 4
              basePrice = Number(pricing.pricePerTire) * tireCount
              baseDuration = pricing.durationPerTire * tireCount
              relevantPackages = [] // No packages needed
            } else {
              // Workshop has rim-size pricing but not for this size â€” don't show workshop
              return null
            }
          } else if (workshop.tireChangePricing && workshop.tireChangePricing.length > 0 && !rimSize) {
            // Workshop has rim-size pricing but no rim size provided (no vehicle selected)
            // Don't show a misleading price â€” set to 0 so frontend shows "Bitte Fahrzeug wÃ¤hlen"
            tireCount = requestedTireCount || 4
            const cheapest = workshop.tireChangePricing
              .slice()
              .sort((a: any, b: any) => Number(a.pricePerTire) - Number(b.pricePerTire))[0]
            basePrice = Number(cheapest.pricePerTire) * tireCount
            baseDuration = cheapest.durationPerTire * tireCount
            relevantPackages = []
          } else {
            // Fallback: use old ServicePackage logic for workshops not yet migrated
            if (mappedPackages.length > 0) {
              relevantPackages = relevantPackages.filter(pkg => 
                pkg.isActive && mappedPackages.includes(pkg.packageType)
              )
              if (relevantPackages.length === 0) return null
            } else {
              relevantPackages = relevantPackages.filter(pkg => pkg.isActive)
            }
          }
        } else {
          // Standard logic for other services
          if (mappedPackages.length > 0) {
            relevantPackages = relevantPackages.filter(pkg => 
              pkg.isActive && mappedPackages.includes(pkg.packageType)
            )
            
            // CRITICAL: If user selected specific packages, workshop MUST have them
            // Only show workshop if it has the selected package activated
            if (relevantPackages.length === 0) {
              return null // Workshop doesn't offer the selected package type (or it's not active)
            }
          } else {
            relevantPackages = relevantPackages.filter(pkg => pkg.isActive)
          }
        }
        
        // Only apply package-based pricing if TIRE_CHANGE hasn't already set price via rim-size pricing
        const alreadyPricedByRimSize = serviceType === 'TIRE_CHANGE' && basePrice > 0 && relevantPackages.length === 0
        
        if (!alreadyPricedByRimSize) {
          if (relevantPackages.length > 0) {
            // Use the FIRST selected package as base (not sum!)
            // For radio-button groups, only one should be selected
            const selectedPackage = relevantPackages[0]
            basePrice = Number(selectedPackage.price)
            baseDuration = selectedPackage.durationMinutes
            
            // Determine tire count from package type
            if (selectedPackage.packageType === 'two_tires') {
              tireCount = 2
            } else if (selectedPackage.packageType === 'four_tires') {
              tireCount = 4
            } else if (selectedPackage.packageType === 'front_two_tires') {
              tireCount = 2
            } else if (selectedPackage.packageType === 'rear_two_tires') {
              tireCount = 2
            } else if (selectedPackage.packageType === 'mixed_four_tires') {
              tireCount = 4
            }
          } else if (service.servicePackages && service.servicePackages.length > 0) {
            // No filter applied, use cheapest package as base
            const cheapestPackage = service.servicePackages
              .filter(pkg => pkg.isActive)
              .sort((a, b) => Number(a.price) - Number(b.price))[0]
            
            if (cheapestPackage) {
              basePrice = Number(cheapestPackage.price)
              baseDuration = cheapestPackage.durationMinutes
              
              // Determine tire count
              if (cheapestPackage.packageType === 'two_tires') {
                tireCount = 2
              } else if (cheapestPackage.packageType === 'four_tires') {
                tireCount = 4
              } else if (cheapestPackage.packageType === 'front_two_tires') {
                tireCount = 2
              } else if (cheapestPackage.packageType === 'rear_two_tires') {
                tireCount = 2
              } else if (cheapestPackage.packageType === 'mixed_four_tires') {
                tireCount = 4
              }
            } else {
              basePrice = service.basePrice ? Number(service.basePrice) : 0
            }
          } else {
            basePrice = service.basePrice ? Number(service.basePrice) : 0
          }
        }
        
        // Additional fees calculation
        // For "Nur Montage" (no tires): surcharges are added in post-processing (else block at bottom)
        // For "Mit Reifenkauf" (with tires): disposal & runflat are calculated in tire search phase
        
        const estimatedDuration = baseDuration

        // Apply mounting-only surcharge for TIRE_CHANGE when customer brings own tires
        let mountingOnlySurchargeApplied = 0
        if (!includeTires && serviceType === 'TIRE_CHANGE' && service.mountingOnlySurcharge && Number(service.mountingOnlySurcharge) > 0) {
          const surchargePerTire = Number(service.mountingOnlySurcharge)
          const effectiveTireCount = tireCount || requestedTireCount || 4
          mountingOnlySurchargeApplied = surchargePerTire * effectiveTireCount
        }

        // totalPrice starts as basePrice â€” surcharges are added in post-processing
        const totalPrice = basePrice

        // Calculate rating from reviews relation
        const reviewsList = workshop.reviews || []
        const avgRating = reviewsList.length > 0
          ? reviewsList.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewsList.length
          : 0
        
        console.log(`â­ [${workshop.companyName}] Rating calculation:`, {
          reviewsCount: reviewsList.length,
          avgRating: Math.round(avgRating * 10) / 10
        })

        // MwSt-Logik: FÃ¼r Ã¶ffentliche Suche immer Preise inkl. MwSt anzeigen
        // "zzgl. MwSt." nur bei eingeloggten B2B-Kunden (spÃ¤ter implementieren)
        const showVatNote = false

        // Parse opening hours to determine availability patterns
        let openSaturday = false
        let openEvening = false
        let openEarly = false
        
        if (workshop.openingHours) {
          try {
            const hours = JSON.parse(workshop.openingHours)
            // Check Saturday
            if (hours.saturday && hours.saturday !== 'closed') {
              openSaturday = true
            }
            // Check evening hours (after 18:00)
            Object.values(hours).forEach((time: any) => {
              if (typeof time === 'string' && time.includes('-')) {
                const [_, closeTime] = time.split('-')
                const closeHour = parseInt(closeTime.split(':')[0])
                if (closeHour >= 18) {
                  openEvening = true
                }
              }
            })
            // Check early hours (before 08:00)
            Object.values(hours).forEach((time: any) => {
              if (typeof time === 'string' && time.includes('-')) {
                const [openTime, _] = time.split('-')
                const openHour = parseInt(openTime.split(':')[0])
                if (openHour <= 8) {
                  openEarly = true
                }
              }
            })
          } catch (e) {
            // Ignore parsing errors
          }
        }

        return {
          id: workshop.id,
          name: workshop.companyName,
          address: workshop.user?.street || null,
          city: workshop.user?.city || null,
          postalCode: workshop.user?.zipCode || null,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          
          // Logo / Images
          logoUrl: workshop.logoUrl || null,
          cardImageUrl: workshop.cardImageUrl || null,
          heroImage: workshop.landingPage?.heroImage || null,
          
          // Pricing
          basePrice,
          totalPrice,
          
          // Mounting-only surcharge pre-calculated
          mountingOnlySurchargeApplied,
          
          // Disposal and RunFlat for "Nur Montage" (pre-calculated)
          disposalFeeApplied: 0,
          runFlatSurchargeApplied: 0,
          
          // WHEEL_CHANGE price breakdown (null for other services)
          wheelChangeBreakdown,
          
          // Store service data for later use (in tire search)
          serviceData: {
            disposalFee: service.disposalFee ? Number(service.disposalFee) : 0,
            runFlatSurcharge: service.runFlatSurcharge ? Number(service.runFlatSurcharge) : 0,
            mountingOnlySurcharge: service.mountingOnlySurcharge ? Number(service.mountingOnlySurcharge) : 0,
            acceptsMountingOnly: service.acceptsMountingOnly !== false,
          },
          
          // Debug pricing
          _debug_pricing: {
            workshopId: workshop.id,
            basePrice,
            totalPrice,
            serviceName: service.serviceType
          },
          
          // VAT
          showVatNote, // Zeigt "zzgl. MwSt." wenn B2B
          
          // Duration
          estimatedDuration,
          
          // Rating
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: reviewsList.length,
          
          // Opening Hours
          openingHours: workshop.openingHours || null,
          openSaturday,
          openEvening,
          openEarly,
          
          // Contact
          phone: workshop.user?.phone || null,
          email: workshop.user?.email || null,
          
          // Payment Methods
          stripeEnabled: workshop.stripeEnabled || false,
          paypalEmail: workshop.paypalEmail || null,
          installmentAvailable: false, // TODO: Add installment logic later
          
          // Available Services
          availableServices: workshop.workshopServices.map(s => s.serviceType),
          hasMultipleServices: workshop.workshopServices.length > 1
        }
      })
      .filter((w): w is NonNullable<typeof w> => w !== null) // Remove null entries
      .filter(w => isWorkshopFixedMode || radiusKm === undefined || w.distance <= radiusKm)
      .sort((a, b) => {
        // Sort by: 1. Rating (desc), 2. Distance (asc)
        if (Math.abs(a.rating - b.rating) > 0.5) {
          return b.rating - a.rating
        }
        return a.distance - b.distance
      })

    // Add tire pricing if requested
    let workshopsWithTires = workshopsWithDistance

    if (includeTires && (tireDimensions || (tireDimensionsFront && tireDimensionsRear))) {
      // Determine which additional services are requested
      const additionalServices = ['with_disposal', 'runflat']
      const selectedAdditionalServices = packageTypes.filter(pt => additionalServices.includes(pt))
      // requireRunFlat already determined above (before workshop mapping)
      const includeDisposal = selectedAdditionalServices.includes('with_disposal')
      
      // Check if this is a mixed tire setup
      const isMixedTireSearch = isMixedTires && tireDimensionsFront && tireDimensionsRear
      
      if (isMixedTireSearch) {
        // Mixed tire search: Search for front and/or rear tires based on selection
        const { width: widthFront, height: heightFront, diameter: diameterFront, loadIndex: loadIndexFront, speedIndex: speedIndexFront } = tireDimensionsFront || {}
        const { width: widthRear, height: heightRear, diameter: diameterRear, loadIndex: loadIndexRear, speedIndex: speedIndexRear } = tireDimensionsRear || {}
        
        const searchFront = frontTireCount > 0 && widthFront && heightFront && diameterFront
        const searchRear = rearTireCount > 0 && widthRear && heightRear && diameterRear
        
        if (searchFront || searchRear) {
          workshopsWithTires = await Promise.all(
            workshopsWithDistance.map(async (workshop) => {
              try {
                const disposalFee = workshop.serviceData?.disposalFee || 0
                const runFlatSurcharge = workshop.serviceData?.runFlatSurcharge || 0
                const seasonFilter = tireFilters?.seasons?.[0] || 'all'
                
                let frontRecsResult: any = null
                let rearRecsResult: any = null
                
                // Search for front tires if needed
                if (searchFront) {
                  console.log(`ðŸŽ¯ [FRONT Search] Workshop ${workshop.id}: width=${widthFront}`)
                  frontRecsResult = await findTireRecommendations(
                    workshop.id,
                    String(widthFront),
                    String(heightFront),
                    String(diameterFront),
                    seasonFilter,
                    'PKW',
                    {
                      minPrice: tireFilters?.minPrice,
                      maxPrice: tireFilters?.maxPrice,
                      quality: tireFilters?.quality,
                      minFuelEfficiency: tireFilters?.minFuelEfficiency,
                      minWetGrip: tireFilters?.minWetGrip,
                      threePMSF: tireFilters?.threePMSF,
                      showDOTTires: tireFilters?.showDOTTires,
                      runFlat: requireRunFlat ? true : undefined,
                      minLoadIndex: loadIndexFront,
                      minSpeedIndex: speedIndexFront
                    },
                    frontTireCount,
                    0,
                    runFlatSurcharge // Always pass surcharge - applied per-tire if tire.runFlat
                  )
                }
                
                // Search for rear tires if needed
                if (searchRear) {
                  console.log(`ðŸŽ¯ [REAR Search] Workshop ${workshop.id}: width=${widthRear}`)
                  rearRecsResult = await findTireRecommendations(
                    workshop.id,
                    String(widthRear),
                    String(heightRear),
                    String(diameterRear),
                    seasonFilter,
                    'PKW',
                    {
                      minPrice: tireFilters?.minPrice,
                      maxPrice: tireFilters?.maxPrice,
                      quality: tireFilters?.quality,
                      minFuelEfficiency: tireFilters?.minFuelEfficiency,
                      minWetGrip: tireFilters?.minWetGrip,
                      threePMSF: tireFilters?.threePMSF,
                      showDOTTires: tireFilters?.showDOTTires,
                      runFlat: requireRunFlat ? true : undefined,
                      minLoadIndex: loadIndexRear,
                      minSpeedIndex: speedIndexRear
                    },
                    rearTireCount,
                    0,
                    runFlatSurcharge // Always pass surcharge - applied per-tire if tire.runFlat
                  )
                }
                
                // Check if required searches found tires
                let frontAvailable = !searchFront || (frontRecsResult?.available && frontRecsResult?.recommendations?.length > 0)
                let rearAvailable = !searchRear || (rearRecsResult?.available && rearRecsResult?.recommendations?.length > 0)
                
                // Get ALL available tires for front and rear (not just top 3 recommendations)
                let allFrontTiresResult: any[] = []
                let allRearTiresResult: any[] = []
                
                if (frontAvailable && searchFront) {
                  allFrontTiresResult = await searchTires({
                    workshopId: workshop.id,
                    width: String(widthFront),
                    height: String(heightFront),
                    diameter: String(diameterFront),
                    season: seasonFilter,
                    minStock: frontTireCount,
                    minPrice: tireFilters?.minPrice,
                    maxPrice: tireFilters?.maxPrice,
                    quality: tireFilters?.quality,
                    minFuelEfficiency: tireFilters?.minFuelEfficiency,
                    minWetGrip: tireFilters?.minWetGrip,
                    threePMSF: tireFilters?.threePMSF,
                    showDOTTires: tireFilters?.showDOTTires,
                    runFlat: requireRunFlat ? true : undefined,
                    minLoadIndex: loadIndexFront,
                    minSpeedIndex: speedIndexFront,
                    sortBy: 'price',
                    sortOrder: 'asc'
                  })
                  console.log(`ðŸ“Š [FRONT All Tires] Workshop ${workshop.id}: Found ${allFrontTiresResult.length} total front tires`)
                }
                
                if (rearAvailable && searchRear) {
                  allRearTiresResult = await searchTires({
                    workshopId: workshop.id,
                    width: String(widthRear),
                    height: String(heightRear),
                    diameter: String(diameterRear),
                    season: seasonFilter,
                    minStock: rearTireCount,
                    minPrice: tireFilters?.minPrice,
                    maxPrice: tireFilters?.maxPrice,
                    quality: tireFilters?.quality,
                    minFuelEfficiency: tireFilters?.minFuelEfficiency,
                    minWetGrip: tireFilters?.minWetGrip,
                    threePMSF: tireFilters?.threePMSF,
                    showDOTTires: tireFilters?.showDOTTires,
                    runFlat: requireRunFlat ? true : undefined,
                    minLoadIndex: loadIndexRear,
                    minSpeedIndex: speedIndexRear,
                    sortBy: 'price',
                    sortOrder: 'asc'
                  })
                  console.log(`ðŸ“Š [REAR All Tires] Workshop ${workshop.id}: Found ${allRearTiresResult.length} total rear tires`)
                }
                
                // If sameBrand filter is active, filter both lists to only matching brands
                if (sameBrand && searchFront && searchRear && allFrontTiresResult.length > 0 && allRearTiresResult.length > 0) {
                  const frontBrands = new Set(allFrontTiresResult.map(t => t.brand.toLowerCase()))
                  const rearBrands = new Set(allRearTiresResult.map(t => t.brand.toLowerCase()))
                  
                  // Find matching brands (available in both)
                  const matchingBrands = Array.from(frontBrands).filter(brand => rearBrands.has(brand))
                  
                  console.log(`ðŸ·ï¸ [sameBrand Filter] Workshop ${workshop.id}: ${frontBrands.size} front brands, ${rearBrands.size} rear brands, ${matchingBrands.length} matching`)
                  
                  if (matchingBrands.length > 0) {
                    // Filter both lists to only tires from matching brands
                    allFrontTiresResult = allFrontTiresResult.filter(t => matchingBrands.includes(t.brand.toLowerCase()))
                    allRearTiresResult = allRearTiresResult.filter(t => matchingBrands.includes(t.brand.toLowerCase()))

                    console.log(`âœ… [sameBrand Filter] Workshop ${workshop.id}: Filtered to ${allFrontTiresResult.length} front, ${allRearTiresResult.length} rear tires`)

                    // Re-pick recommendations from filtered lists so the displayed Top-Picks (Günstigster/Beste/Premium)
                    // also respect the sameBrand filter. Without this, frontRec/rearRec would still come from the
                    // unfiltered recommendation arrays and could show different brands per axle.
                    const rebuildRecs = (
                      original: any,
                      filteredAll: any[],
                      qty: number
                    ) => {
                      if (!original) return original
                      const filteredOriginal = (original.recommendations || []).filter((rec: any) =>
                        matchingBrands.includes(String(rec.tire?.brand || '').toLowerCase())
                      )
                      let recs = filteredOriginal
                      if (recs.length === 0 && filteredAll.length > 0) {
                        const cheapest = [...filteredAll].sort((a, b) =>
                          parseFloat(a.sellingPrice) - parseFloat(b.sellingPrice)
                        )[0]
                        recs = [{
                          label: 'Günstigster',
                          tire: cheapest,
                          pricePerTire: parseFloat(parseFloat(cheapest.sellingPrice).toFixed(2)),
                          totalPrice: parseFloat((parseFloat(cheapest.sellingPrice) * qty).toFixed(2)),
                          quantity: qty,
                        }]
                      }
                      return {
                        ...original,
                        available: recs.length > 0,
                        recommendations: recs,
                      }
                    }

                    frontRecsResult = rebuildRecs(frontRecsResult, allFrontTiresResult, frontTireCount)
                    rearRecsResult = rebuildRecs(rearRecsResult, allRearTiresResult, rearTireCount)

                    frontAvailable = !searchFront || (frontRecsResult?.available && frontRecsResult?.recommendations?.length > 0)
                    rearAvailable = !searchRear || (rearRecsResult?.available && rearRecsResult?.recommendations?.length > 0)
                  } else {
                    console.log(`âŒ [sameBrand Filter] Workshop ${workshop.id}: No matching brands found, skipping workshop`)
                    return null
                  }
                }
                
                // Build workshop result - even if some tires are missing, still show workshop
                const frontRec = frontRecsResult?.recommendations?.[0]
                const rearRec = rearRecsResult?.recommendations?.[0]
                const bothAvailable = frontAvailable && rearAvailable
                const eitherAvailable = frontAvailable || rearAvailable
                
                // Calculate combined price (only for available tires)
                let combinedTirePrice = 0
                let totalTireCount = 0
                
                if (frontRec) {
                  combinedTirePrice += frontRec.totalPrice
                  totalTireCount += frontTireCount
                }
                if (rearRec) {
                  combinedTirePrice += rearRec.totalPrice
                  totalTireCount += rearTireCount
                }
                
                // For disposal fee: use total tire count for available tires, or requested count for service-only
                const disposalTireCount = bothAvailable ? totalTireCount : requestedTireCount
                const disposalFeeTotal = includeDisposal ? disposalFee * disposalTireCount : 0
                const runFlatSurchargeApplied = requireRunFlat ? runFlatSurcharge * requestedTireCount : 0
                const newTotalPrice = workshop.totalPrice + disposalFeeTotal + runFlatSurchargeApplied + combinedTirePrice
                
                console.log(`ðŸ”„ [Mixed Tires] Workshop ${workshop.id}: front=${frontRec?.totalPrice || 0} (${frontAvailable ? 'available' : 'MISSING'}), rear=${rearRec?.totalPrice || 0} (${rearAvailable ? 'available' : 'MISSING'}), total=${combinedTirePrice}`)
                
                // Build unavailable dimensions info for frontend
                const unavailableDimensions: string[] = []
                if (searchFront && !frontAvailable) {
                  unavailableDimensions.push(`VA ${widthFront}/${heightFront} R${diameterFront}`)
                }
                if (searchRear && !rearAvailable) {
                  unavailableDimensions.push(`HA ${widthRear}/${heightRear} R${diameterRear}`)
                }
                
                return {
                  ...workshop,
                  // Mixed tire data
                  isMixedTires: true,
                  tirePrice: combinedTirePrice,
                  tireAvailable: bothAvailable,
                  tirePartiallyAvailable: eitherAvailable && !bothAvailable,
                  unavailableDimensions, // e.g. ["HA 275/30 R21"]
                  ...(frontRec && {
                    tireFront: {
                      brand: frontRec.tire.brand,
                      model: frontRec.tire.model,
                      pricePerTire: frontRec.pricePerTire,
                      totalPrice: frontRec.totalPrice,
                      quantity: frontTireCount,
                      dimensions: `${widthFront}/${heightFront} R${diameterFront}`
                    },
                    // Include top 3 recommendations PLUS all other available tires
                    tireFrontRecommendations: [
                      // First add the 3 recommendations (GÃ¼nstigster, Testsieger, Beliebt)
                      ...frontRecsResult.recommendations.map((rec: any) => ({
                        label: rec.label,
                        tire: rec.tire,
                        pricePerTire: rec.pricePerTire,
                        totalPrice: rec.totalPrice,
                        quantity: rec.quantity
                      })),
                      // Then add all other tires (exclude duplicates already in recommendations)
                      ...allFrontTiresResult
                        .filter(tire => !frontRecsResult.recommendations.some((rec: any) => rec.tire.id === tire.id))
                        .map(tire => {
                          return {
                            label: '', // No label for non-recommendation tires
                            tire: tire,
                            pricePerTire: parseFloat(tire.sellingPrice.toFixed(2)),
                            totalPrice: parseFloat((tire.sellingPrice * frontTireCount).toFixed(2)),
                            quantity: frontTireCount
                          }
                        })
                    ]
                  }),
                  ...(rearRec && {
                    tireRear: {
                      brand: rearRec.tire.brand,
                      model: rearRec.tire.model,
                      pricePerTire: rearRec.pricePerTire,
                      totalPrice: rearRec.totalPrice,
                      quantity: rearTireCount,
                      dimensions: `${widthRear}/${heightRear} R${diameterRear}`
                    },
                    // Include top 3 recommendations PLUS all other available tires
                    tireRearRecommendations: [
                      // First add the 3 recommendations (GÃ¼nstigster, Testsieger, Beliebt)
                      ...rearRecsResult.recommendations.map((rec: any) => ({
                        label: rec.label,
                        tire: rec.tire,
                        pricePerTire: rec.pricePerTire,
                        totalPrice: rec.totalPrice,
                        quantity: rec.quantity
                      })),
                      // Then add all other tires (exclude duplicates already in recommendations)
                      ...allRearTiresResult
                        .filter(tire => !rearRecsResult.recommendations.some((rec: any) => rec.tire.id === tire.id))
                        .map(tire => {
                          return {
                            label: '', // No label for non-recommendation tires
                            tire: tire,
                            pricePerTire: parseFloat(tire.sellingPrice.toFixed(2)),
                            totalPrice: parseFloat((tire.sellingPrice * rearTireCount).toFixed(2)),
                            quantity: rearTireCount
                          }
                        })
                    ]
                  }),
                  tireQuantity: totalTireCount || requestedTireCount,
                  disposalFeeApplied: disposalFeeTotal,
                  runFlatSurchargeApplied,
                  totalPrice: newTotalPrice
                }
              } catch (error) {
                console.error(`Error fetching mixed tires for workshop ${workshop.id}:`, error)
                return {
                  ...workshop,
                  isMixedTires: true,
                  tireAvailable: false,
                  tirePrice: 0,
                  tireRecommendations: [],
                }
              }
            })
          )
          
          // Filter out null entries (shouldn't happen anymore, but safety check)
          workshopsWithTires = workshopsWithTires.filter((w): w is NonNullable<typeof w> => w !== null)
        }
      } else if (tireDimensions) {
        // Standard single tire size search
        const { width, height, diameter, loadIndex, speedIndex, articleId: requestedArticleId, tireBrand: requestedBrand, tireModel: requestedModel } = tireDimensions
        
        console.log(`ðŸ”’ [TIRE SAFETY CHECK] Received dimensions:`, {
          width, height, diameter,
          loadIndex: loadIndex || 'MISSING âš ï¸',
          speedIndex: speedIndex || 'MISSING âš ï¸'
        })
        
        if (width && height && diameter) {
        // Fetch tire recommendations for each workshop
        workshopsWithTires = await Promise.all(
          workshopsWithDistance.map(async (workshop) => {
            try {
              // Get fees from serviceData that was stored during workshop mapping
              const disposalFee = workshop.serviceData?.disposalFee || 0
              const runFlatSurcharge = workshop.serviceData?.runFlatSurcharge || 0
              
              const seasonFilter = tireFilters?.seasons?.[0] || 'all'
              console.log(`ðŸ” [Season Filter] Workshop ${workshop.id}: tireFilters.seasons=${JSON.stringify(tireFilters?.seasons)}, using season="${seasonFilter}"`)
              console.log(`ðŸ” [DEBUG Tire Search] Workshop ${workshop.id}:`, {
                width: String(width),
                height: String(height),
                diameter: String(diameter),
                season: seasonFilter,
                vehicleType: 'PKW',
                requestedTireCount,
                runFlat: requireRunFlat ? true : undefined,
                showDOTTires: tireFilters?.showDOTTires,
                quality: tireFilters?.quality
              })
              
              const recsResult = await findTireRecommendations(
                workshop.id,
                String(width),
                String(height),
                String(diameter),
                seasonFilter,
                'PKW',
                {
                  minPrice: tireFilters?.minPrice,
                  maxPrice: tireFilters?.maxPrice,
                  quality: tireFilters?.quality,
                  minFuelEfficiency: tireFilters?.minFuelEfficiency,
                  minWetGrip: tireFilters?.minWetGrip,
                  threePMSF: tireFilters?.threePMSF,
                  showDOTTires: tireFilters?.showDOTTires,
                  runFlat: requireRunFlat ? true : undefined,
                  minLoadIndex: loadIndex,
                  minSpeedIndex: speedIndex
                },
                requestedTireCount, // Pass the requested tire count
                0, // disposalFee NOT added to tire price
                0 // RunFlat surcharge NOT added to tire price - calculated separately
              )

              // Also get ALL tires for user selection (not just top 3 recommendations)
              const allTiresResult = await searchTires({
                workshopId: workshop.id,
                width: String(width),
                height: String(height),
                diameter: String(diameter),
                season: seasonFilter,
                minStock: requestedTireCount,
                minPrice: tireFilters?.minPrice,
                maxPrice: tireFilters?.maxPrice,
                quality: tireFilters?.quality,
                minFuelEfficiency: tireFilters?.minFuelEfficiency,
                minWetGrip: tireFilters?.minWetGrip,
                threePMSF: tireFilters?.threePMSF,
                showDOTTires: tireFilters?.showDOTTires,
                runFlat: requireRunFlat ? true : undefined,
                minLoadIndex: loadIndex,
                minSpeedIndex: speedIndex,
                sortBy: 'price',
                sortOrder: 'asc'
              })

              console.log(`ðŸ“Š [DEBUG Tire Result] Workshop ${workshop.id}:`, {
                available: recsResult.available,
                recommendationsCount: recsResult.recommendations?.length || 0,
                allTiresCount: allTiresResult?.length || 0,
                firstRec: recsResult.recommendations?.[0] ? {
                  brand: recsResult.recommendations[0].brand,
                  model: recsResult.recommendations[0].model,
                  price: recsResult.recommendations[0].pricePerTire,
                  totalPrice: recsResult.recommendations[0].totalPrice
                } : null
              })

              if (recsResult.available && recsResult.recommendations.length > 0) {
                // If AI recommended a specific tire, find it by articleId or brand+model
                let defaultRec = recsResult.recommendations[0] // cheapest fallback
                if (requestedArticleId || requestedBrand) {
                  let matched = false
                  // Strategy 1: Match by articleId
                  if (requestedArticleId) {
                    const matchedRec = recsResult.recommendations.find(r => r.tire.articleNumber === requestedArticleId)
                    if (matchedRec) {
                      defaultRec = matchedRec
                      matched = true
                      console.log(`✅ [AI Tire Match] articleId match in recommendations: ${requestedArticleId}`)
                    } else {
                      const matchedTire = allTiresResult.find(t => t.articleNumber === requestedArticleId)
                      if (matchedTire) {
                        defaultRec = {
                          ...defaultRec,
                          tire: matchedTire,
                          pricePerTire: parseFloat(matchedTire.sellingPrice.toFixed(2)),
                          totalPrice: parseFloat((matchedTire.sellingPrice * requestedTireCount).toFixed(2)),
                          label: 'KI-Empfehlung',
                        }
                        matched = true
                        console.log(`✅ [AI Tire Match] articleId match in allTires: ${requestedArticleId}`)
                      }
                    }
                  }
                  // Strategy 2: Fallback to brand+model matching
                  if (!matched && requestedBrand) {
                    const brandLC = requestedBrand.toLowerCase()
                    const modelLC = (requestedModel || '').toLowerCase()
                    const matchedRec = recsResult.recommendations.find(r => 
                      r.tire.brand.toLowerCase() === brandLC && 
                      (modelLC === '' || r.tire.model?.toLowerCase() === modelLC)
                    )
                    if (matchedRec) {
                      defaultRec = matchedRec
                      matched = true
                      console.log(`✅ [AI Tire Match] brand+model match in recommendations: ${requestedBrand} ${requestedModel}`)
                    } else {
                      const matchedTire = allTiresResult.find(t => 
                        t.brand.toLowerCase() === brandLC && 
                        (modelLC === '' || t.model?.toLowerCase() === modelLC)
                      )
                      if (matchedTire) {
                        defaultRec = {
                          ...defaultRec,
                          tire: matchedTire,
                          pricePerTire: parseFloat(matchedTire.sellingPrice.toFixed(2)),
                          totalPrice: parseFloat((matchedTire.sellingPrice * requestedTireCount).toFixed(2)),
                          label: 'KI-Empfehlung',
                        }
                        matched = true
                        console.log(`✅ [AI Tire Match] brand+model match in allTires: ${requestedBrand} ${requestedModel}`)
                      }
                    }
                  }
                  if (!matched) {
                    console.log(`⚠️ [AI Tire Match] No match found for articleId=${requestedArticleId}, brand=${requestedBrand}, model=${requestedModel}. Falling back to cheapest.`)
                  }
                }
                
                // Calculate disposal fee (added to montage, not to tires)
                const disposalFeeTotal = includeDisposal ? disposalFee * requestedTireCount : 0
                console.log(`ðŸ’° [Disposal Fee] Workshop ${workshop.id}: includeDisposal=${includeDisposal}, disposalFee=${disposalFee}, requestedTireCount=${requestedTireCount}, disposalFeeTotal=${disposalFeeTotal}`)
                
                const runFlatSurchargeApplied = requireRunFlat ? runFlatSurcharge * requestedTireCount : 0
                
                const newTotalPrice = workshop.totalPrice + disposalFeeTotal + runFlatSurchargeApplied + defaultRec.totalPrice
                console.log(`ðŸ’µ [Total Price] Workshop ${workshop.id}: service=${workshop.totalPrice}, disposal=${disposalFeeTotal}, tires=${defaultRec.totalPrice}, TOTAL=${newTotalPrice}`)
                
                return {
                  ...workshop,
                  // Default tire (cheapest)
                  tirePrice: defaultRec.totalPrice,
                  tirePricePerTire: defaultRec.pricePerTire,
                  tireQuantity: defaultRec.quantity,
                  tireBrand: defaultRec.tire.brand,
                  tireModel: defaultRec.tire.model,
                  tireAvailable: true,
                  // Price breakdown for display
                  disposalFeeApplied: disposalFeeTotal,
                  runFlatSurchargeApplied,
                  // All recommendations for display (top 3 + all available tires)
                  tireRecommendations: [
                    // First add the 3 recommendations (GÃ¼nstigster, Testsieger, Beliebt)
                    ...recsResult.recommendations.map(rec => ({
                      label: rec.label,
                      brand: rec.tire.brand,
                      model: rec.tire.model,
                      articleId: rec.tire.articleNumber,
                      ean: rec.tire.ean || null,
                      pricePerTire: rec.pricePerTire,
                      totalPrice: rec.totalPrice,
                      quantity: rec.quantity,
                      width: rec.tire.width || null,
                      height: rec.tire.height || null,
                      diameter: rec.tire.diameter || null,
                      loadIndex: rec.tire.loadIndex || null,
                      speedIndex: rec.tire.speedIndex || null,
                      labelFuelEfficiency: rec.tire.labelFuelEfficiency || null,
                      labelWetGrip: rec.tire.labelWetGrip || null,
                      labelNoise: rec.tire.labelNoise || null,
                      threePMSF: rec.tire.threePMSF,
                      runFlat: rec.tire.runFlat,
                    })),
                    // Then add all other tires (exclude duplicates already in recommendations)
                    ...allTiresResult
                      .filter(tire => !recsResult.recommendations.some(rec => rec.tire.id === tire.id))
                      .map(tire => {
                        return {
                          label: '', // No label for non-recommendation tires
                          brand: tire.brand,
                          model: tire.model,
                          articleId: tire.articleNumber,
                          ean: tire.ean || null,
                          pricePerTire: parseFloat(tire.sellingPrice.toFixed(2)),
                          totalPrice: parseFloat((tire.sellingPrice * requestedTireCount).toFixed(2)),
                          quantity: requestedTireCount,
                          width: tire.width || null,
                          height: tire.height || null,
                          diameter: tire.diameter || null,
                          loadIndex: tire.loadIndex || null,
                          speedIndex: tire.speedIndex || null,
                          labelFuelEfficiency: tire.labelFuelEfficiency || null,
                          labelWetGrip: tire.labelWetGrip || null,
                          labelNoise: tire.labelNoise || null,
                          threePMSF: tire.threePMSF,
                          runFlat: tire.runFlat,
                        }
                      })
                  ],
                  // Update total price (service + disposal + cheapest tires)
                  totalPrice: newTotalPrice,
                }
              } else {
                return {
                  ...workshop,
                  tireAvailable: false,
                  tirePrice: 0,
                  tireRecommendations: [],
                }
              }
            } catch (error) {
              console.error(`Error fetching tires for workshop ${workshop.id}:`, error)
              return {
                ...workshop,
                tireAvailable: false,
                tirePrice: 0,
                tireRecommendations: [],
              }
            }
          })
        )
      }
      }
    } else {
      // No tire search requested - calculate disposal, runflat and mounting surcharges
      const wantsDisposal = packageTypes.includes('with_disposal')
      const wantsRunFlat = packageTypes.includes('runflat')
      workshopsWithTires = workshopsWithDistance.map(workshop => {
        let adjustedTotal = workshop.totalPrice
        let disposalFeeApplied = 0
        let runFlatSurchargeApplied = 0

        // Add mounting-only surcharge if applicable
        const mountingSurcharge = workshop.mountingOnlySurchargeApplied || 0
        adjustedTotal += mountingSurcharge

        if (wantsDisposal) {
          const disposalFee = workshop.serviceData?.disposalFee || 0
          disposalFeeApplied = disposalFee * requestedTireCount
          adjustedTotal += disposalFeeApplied
        }
        
        if (wantsRunFlat) {
          const runFlatFee = workshop.serviceData?.runFlatSurcharge || 0
          runFlatSurchargeApplied = runFlatFee * requestedTireCount
          adjustedTotal += runFlatSurchargeApplied
        }
        
        return {
          ...workshop,
          totalPrice: adjustedTotal,
          disposalFeeApplied,
          runFlatSurchargeApplied,
          mountingOnlySurchargeApplied: mountingSurcharge,
          tireAvailable: false,
          tirePrice: 0
        }
      })
    }

    // Filter: If customer wants tires ("Mit Reifen"), exclude workshops that have no tires available
    if (includeTires) {
      const beforeCount = workshopsWithTires.length
      workshopsWithTires = workshopsWithTires.filter(w => {
        if (w.tireAvailable === false) {
          console.log(`🚫 [${w.name}] Skipped: no tires available (customer selected "Mit Reifen")`)
          return false
        }
        return true
      })
      if (beforeCount !== workshopsWithTires.length) {
        console.log(`📦 Filtered ${beforeCount - workshopsWithTires.length} workshops without tire availability`)
      }
    }

    return NextResponse.json({
      success: true,
      workshops: workshopsWithTires
    })

  } catch (error) {
    console.error('Error searching workshops:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Werkstatt-Suche' },
      { status: 500 }
    )
  }
}

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
