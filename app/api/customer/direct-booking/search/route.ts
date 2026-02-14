import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findCheapestTire, findTireRecommendations } from '@/lib/services/tireSearchService'

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
      // Tire search parameters (optional)
      includeTires = false,
      tireDimensions,
      tireDimensionsFront, // For mixed tires: front axle dimensions
      tireDimensionsRear,  // For mixed tires: rear axle dimensions
      tireFilters,
      sameBrand = false // For mixed 4 tires: require same brand for front and rear
    } = body
    
    console.log('🔍 [API] Received sameBrand parameter:', { sameBrand, type: typeof sameBrand })

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
    console.log('🔢 [API] Requested tire count:', requestedTireCount, 'isMixedTires:', isMixedTires, 'from packageTypes:', packageTypes)
    console.log('🔍 [API] Tire dimensions received:', { 
      includeTires, 
      tireDimensions, 
      tireDimensionsFront, 
      tireDimensionsRear 
    })

    // Validate location parameters only (vehicle not needed for search)
    if (customerLat === undefined || customerLon === undefined) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: customerLat, customerLon erforderlich' },
        { status: 400 }
      )
    }

    // Vehicle selection happens later in booking flow

    // Vehicle selection happens later in booking flow

    // Find workshops with selected service in radius that allow direct booking
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: serviceType,
            isActive: true,
            allowsDirectBooking: true
          }
        }
      },
      include: {
        workshopServices: {
          where: {
            isActive: true,
            allowsDirectBooking: true
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

    // Calculate distance and filter by radius
    const workshopsWithDistance = workshops
      .map(workshop => {
        // Find the searched service
        const service = workshop.workshopServices.find(s => s.serviceType === serviceType)
        if (!service) return null // Skip workshops without the searched service
        
        // Haversine formula for distance calculation
        const lat1 = customerLat
        const lon1 = customerLon
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
                                  'basic', 'with_balancing', 'with_storage', 'complete',
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
        console.log('🔄 [API] Package mapping:', { original: selectedMainPackages, mapped: mappedPackages })
        
        // Filter packages by selected main package types
        let relevantPackages = service.servicePackages || []
        
        // Special handling for WHEEL_CHANGE with additive pricing (checkboxes)
        if (serviceType === 'WHEEL_CHANGE') {
          // Find required packages
          const basicPackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'basic')
          const balancingPackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'with_balancing')
          const storagePackage = relevantPackages.find(pkg => pkg.isActive && pkg.packageType === 'with_storage')
          
          if (!basicPackage) {
            return null // Workshop must have basic package
          }
          
          // If no filters selected, return only basic package with its original price
          if (selectedMainPackages.length === 0) {
            relevantPackages = [basicPackage]
          } else {
            // Calculate additive price based on selected filters
            const hasBalancing = selectedMainPackages.includes('with_balancing')
            const hasStorage = selectedMainPackages.includes('with_storage')
            
            // Check if workshop offers selected options
            if (hasBalancing && !balancingPackage) {
              return null // User wants balancing but workshop doesn't offer it
            }
            if (hasStorage && !storagePackage) {
              return null // User wants storage but workshop doesn't offer it
            }
            
            // Calculate additive price: start with basic
            let totalPrice = Number(basicPackage.price)
            let totalDuration = basicPackage.durationMinutes
            
            // Add balancing surcharge if selected
            if (hasBalancing && balancingPackage) {
              const basicPrice = Number(basicPackage.price)
              const balancingFullPrice = Number(balancingPackage.price)
              const balancingSurcharge = balancingFullPrice - basicPrice
              totalPrice += balancingSurcharge
              totalDuration = balancingPackage.durationMinutes
            }
            
            // Add storage surcharge if selected
            if (hasStorage && storagePackage) {
              const basicPrice = Number(basicPackage.price)
              const storageFullPrice = Number(storagePackage.price)
              const storageSurcharge = storageFullPrice - basicPrice
              totalPrice += storageSurcharge
            }
            
            // Use basic package as base but with calculated price
            relevantPackages = [{ ...basicPackage, price: totalPrice, durationMinutes: totalDuration }]
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
        
        // Additional fees are now calculated separately:
        // - Disposal fee: added to total at the end (disposalFeeTotal)
        // - RunFlat surcharge: included in tire pricePerTire calculation
        
        const totalPrice = basePrice
        const estimatedDuration = baseDuration

        // Calculate rating
        const reviews = workshop.bookings.filter(b => b.tireRating || b.review)
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, b) => {
              // Priorisiere review.rating, dann tireRating
              const rating = b.review?.rating || b.tireRating || 0
              return sum + rating
            }, 0) / reviews.length
          : 0
        
        console.log(`⭐ [${workshop.companyName}] Rating calculation:`, {
          bookingsTotal: workshop.bookings.length,
          reviewsWithRating: reviews.length,
          avgRating: Math.round(avgRating * 10) / 10,
          ratings: reviews.map(b => b.review?.rating || b.tireRating || 0),
          willShowRating: avgRating > 0 && reviews.length > 0
        })

        // MwSt-Logik: Für öffentliche Suche immer Preise inkl. MwSt anzeigen
        // "zzgl. MwSt." nur bei eingeloggten B2B-Kunden (später implementieren)
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
          
          // Logo
          logoUrl: workshop.logoUrl || null,
          
          // Pricing
          basePrice,
          totalPrice,
          
          // Store service data for later use (in tire search)
          serviceData: {
            disposalFee: service.disposalFee ? Number(service.disposalFee) : 0,
            runFlatSurcharge: service.runFlatSurcharge ? Number(service.runFlatSurcharge) : 0,
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
          reviewCount: reviews.length,
          
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
      .filter(w => radiusKm === undefined || w.distance <= radiusKm)
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
      const requireRunFlat = selectedAdditionalServices.includes('runflat')
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
                let matchingBrands: string[] | undefined = undefined
                
                // If sameBrand filter is active AND we're searching both sizes, find matching brands first
                if (sameBrand && searchFront && searchRear) {
                  console.log(`🔍 [sameBrand Pre-Filter] Workshop ${workshop.id}: Finding matching brands...`)
                  
                  // Query for brands available in front size
                  const frontBrandsResult = await prisma.workshopInventory.findMany({
                    where: {
                      workshopId: workshop.id,
                      width: String(widthFront),
                      height: String(heightFront),
                      diameter: String(diameterFront),
                      season: seasonFilter === 'all' ? undefined : seasonFilter,
                      stock: { gte: frontTireCount }
                    },
                    select: { brand: true },
                    distinct: ['brand']
                  })
                  
                  // Query for brands available in rear size
                  const rearBrandsResult = await prisma.workshopInventory.findMany({
                    where: {
                      workshopId: workshop.id,
                      width: String(widthRear),
                      height: String(heightRear),
                      diameter: String(diameterRear),
                      season: seasonFilter === 'all' ? undefined : seasonFilter,
                      stock: { gte: rearTireCount }
                    },
                    select: { brand: true },
                    distinct: ['brand']
                  })
                  
                  const frontBrands = frontBrandsResult.map(r => r.brand.toLowerCase())
                  const rearBrands = rearBrandsResult.map(r => r.brand.toLowerCase())
                  
                  // Find intersection - brands available in both sizes
                  matchingBrands = frontBrandsResult
                    .filter(fb => rearBrands.includes(fb.brand.toLowerCase()))
                    .map(fb => fb.brand)
                  
                  console.log(`🏷️ [sameBrand Pre-Filter] Workshop ${workshop.id}:`, {
                    frontBrandsCount: frontBrands.length,
                    rearBrandsCount: rearBrands.length,
                    matchingBrandsCount: matchingBrands.length,
                    matchingBrands: matchingBrands.slice(0, 10) // Only log first 10 to avoid truncation
                  })
                  
                  console.log(`📋 [DEBUG] matchingBrands array:`, JSON.stringify(matchingBrands.slice(0, 5)))
                  
                  // If no matching brands, skip this workshop entirely
                  if (matchingBrands.length === 0) {
                    console.log(`❌ [sameBrand Pre-Filter] Workshop ${workshop.id}: No matching brands found, skipping`)
                    return null
                  }
                  
                  // For sameBrand: Find all valid brand combinations
                  const allBrandCombinations = []
                  
                  console.log(`🔍 [sameBrand Search] Workshop ${workshop.id}: Testing ${matchingBrands.length} brands...`)
                  
                  // Premium brands for prioritization
                  const premiumBrands = ['Michelin', 'Continental', 'Pirelli', 'Bridgestone', 'Goodyear', 'Dunlop']
                  const qualityBrands = ['Hankook', 'Kumho', 'Yokohama', 'Toyo', 'Falken', 'BFGoodrich', 'Cooper', 'Nokian']
                  
                  for (const brand of matchingBrands) {
                    // Search front with this specific brand
                    const frontResult = await findTireRecommendations(
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
                        minFuelEfficiency: tireFilters?.fuelEfficiency,
                        minWetGrip: tireFilters?.wetGrip,
                        threePMSF: tireFilters?.threePMSF,
                        showDOTTires: tireFilters?.showDOTTires,
                        runFlat: requireRunFlat || undefined,
                        minLoadIndex: loadIndexFront,
                        minSpeedIndex: speedIndexFront,
                        brands: [brand] // Single brand
                      },
                      frontTireCount,
                      0,
                      requireRunFlat ? runFlatSurcharge : 0
                    )
                    
                    // Search rear with same brand
                    const rearResult = await findTireRecommendations(
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
                        minFuelEfficiency: tireFilters?.fuelEfficiency,
                        minWetGrip: tireFilters?.wetGrip,
                        threePMSF: tireFilters?.threePMSF,
                        showDOTTires: tireFilters?.showDOTTires,
                        runFlat: requireRunFlat || undefined,
                        minLoadIndex: loadIndexRear,
                        minSpeedIndex: speedIndexRear,
                        brands: [brand] // Same brand
                      },
                      rearTireCount,
                      0,
                      requireRunFlat ? runFlatSurcharge : 0
                    )
                    
                    // Check if both searches found tires
                    if (frontResult?.available && frontResult?.recommendations?.length > 0 &&
                        rearResult?.available && rearResult?.recommendations?.length > 0) {
                      const combinedPrice = frontResult.recommendations[0].totalPrice + rearResult.recommendations[0].totalPrice
                      
                      allBrandCombinations.push({
                        brand,
                        front: frontResult,
                        rear: rearResult,
                        price: combinedPrice,
                        isPremium: premiumBrands.includes(brand),
                        isQuality: qualityBrands.includes(brand)
                      })
                    }
                  }
                  
                  if (allBrandCombinations.length === 0) {
                    console.log(`❌ [sameBrand Search] Workshop ${workshop.id}: No valid brand combination found`)
                    return null
                  }
                  
                  // Sort by price
                  allBrandCombinations.sort((a, b) => a.price - b.price)
                  
                  // Select best options: Günstigster, Testsieger (Premium), Beliebt (Quality)
                  let selectedCombination = null
                  
                  // Always use cheapest as default
                  selectedCombination = allBrandCombinations[0]
                  
                  // Try to find premium brand
                  const premiumOption = allBrandCombinations.find(c => c.isPremium)
                  
                  // Try to find quality brand
                  const qualityOption = allBrandCombinations.find(c => c.isQuality)
                  
                  // Create combined recommendations with multiple brand options
                  const brandOptions = []
                  
                  // 1. Günstigster (always available)
                  brandOptions.push({
                    label: 'Günstigster',
                    brand: selectedCombination.brand,
                    front: selectedCombination.front.recommendations[0],
                    rear: selectedCombination.rear.recommendations[0],
                    price: selectedCombination.price
                  })
                  
                  // 2. Testsieger (Premium - if different from cheapest)
                  if (premiumOption && premiumOption.brand !== selectedCombination.brand) {
                    brandOptions.push({
                      label: 'Testsieger',
                      brand: premiumOption.brand,
                      front: premiumOption.front.recommendations[0],
                      rear: premiumOption.rear.recommendations[0],
                      price: premiumOption.price
                    })
                  }
                  
                  // 3. Beliebt (Quality - if different from both)
                  if (qualityOption && qualityOption.brand !== selectedCombination.brand && 
                      (!premiumOption || qualityOption.brand !== premiumOption.brand)) {
                    brandOptions.push({
                      label: 'Beliebt',
                      brand: qualityOption.brand,
                      front: qualityOption.front.recommendations[0],
                      rear: qualityOption.rear.recommendations[0],
                      price: qualityOption.price
                    })
                  }
                  
                  console.log(`✅ [sameBrand Search] Workshop ${workshop.id}: Found ${allBrandCombinations.length} combinations, showing ${brandOptions.length} options: ${brandOptions.map(o => o.brand).join(', ')}`)
                  
                  // Use the cheapest combination as default (can be changed later to show all options)
                  frontRecsResult = selectedCombination.front
                  rearRecsResult = selectedCombination.rear
                  
                  // Store all brand options for potential future use
                  workshop.brandOptions = brandOptions
                } else {
                  // Normal search without sameBrand filter
                  // Search for front tires if needed
                  if (searchFront) {
                    console.log(`🎯 [FRONT Search] Workshop ${workshop.id}: width=${widthFront}, brands=NO FILTER`)
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
                      minFuelEfficiency: tireFilters?.fuelEfficiency,
                      minWetGrip: tireFilters?.wetGrip,
                      threePMSF: tireFilters?.threePMSF,
                      showDOTTires: tireFilters?.showDOTTires,
                      runFlat: requireRunFlat || undefined,
                      minLoadIndex: loadIndexFront,
                      minSpeedIndex: speedIndexFront
                    },
                      frontTireCount,
                      0,
                      requireRunFlat ? runFlatSurcharge : 0
                    )
                  }
                  
                  // Search for rear tires if needed
                  if (searchRear) {
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
                      minFuelEfficiency: tireFilters?.fuelEfficiency,
                      minWetGrip: tireFilters?.wetGrip,
                      threePMSF: tireFilters?.threePMSF,
                      showDOTTires: tireFilters?.showDOTTires,
                      runFlat: requireRunFlat || undefined,
                      minLoadIndex: loadIndexRear,
                      minSpeedIndex: speedIndexRear
                    },
                      rearTireCount,
                      0,
                      requireRunFlat ? runFlatSurcharge : 0
                    )
                  }
                }
                
                // Check if required searches found tires
                const frontAvailable = !searchFront || (frontRecsResult?.available && frontRecsResult?.recommendations?.length > 0)
                const rearAvailable = !searchRear || (rearRecsResult?.available && rearRecsResult?.recommendations?.length > 0)
                
                if (frontAvailable && rearAvailable) {
                  const frontRec = frontRecsResult?.recommendations?.[0]
                  const rearRec = rearRecsResult?.recommendations?.[0]
                  
                  // Calculate combined price
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
                  
                  const disposalFeeTotal = includeDisposal ? disposalFee * totalTireCount : 0
                  const newTotalPrice = workshop.totalPrice + disposalFeeTotal + combinedTirePrice
                  
                  console.log(`🔄 [Mixed Tires] Workshop ${workshop.id}: front=${frontRec?.totalPrice || 0}, rear=${rearRec?.totalPrice || 0}, total=${combinedTirePrice}`)
                  
                  return {
                    ...workshop,
                    // Mixed tire data
                    isMixedTires: true,
                    tirePrice: combinedTirePrice,
                    // Brand options for sameBrand filter (if active)
                    ...(sameBrand && workshop.brandOptions && { brandOptions: workshop.brandOptions }),
                    ...(frontRec && {
                      tireFront: {
                        brand: frontRec.tire.brand,
                        model: frontRec.tire.model,
                        pricePerTire: frontRec.pricePerTire,
                        totalPrice: frontRec.totalPrice,
                        quantity: frontTireCount,
                        dimensions: `${widthFront}/${heightFront} R${diameterFront}`
                      },
                      tireFrontRecommendations: frontRecsResult.recommendations // All 3 options for badges
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
                      tireRearRecommendations: rearRecsResult.recommendations // All 3 options for badges
                    }),
                    tireQuantity: totalTireCount,
                    tireAvailable: true,
                    disposalFeeApplied: disposalFeeTotal,
                    totalPrice: newTotalPrice
                  }
                }
                
                // If either search failed, return null (workshop excluded)
                return null
              } catch (error) {
                console.error(`Error fetching mixed tires for workshop ${workshop.id}:`, error)
                return null
              }
            })
          )
          
          // Filter out workshops without available mixed tires
          workshopsWithTires = workshopsWithTires.filter((w): w is NonNullable<typeof w> => w !== null)
        }
      } else if (tireDimensions) {
        // Standard single tire size search
        const { width, height, diameter, loadIndex, speedIndex } = tireDimensions
        
        console.log(`🔒 [TIRE SAFETY CHECK] Received dimensions:`, {
          width, height, diameter,
          loadIndex: loadIndex || 'MISSING ⚠️',
          speedIndex: speedIndex || 'MISSING ⚠️'
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
              console.log(`🔍 [Season Filter] Workshop ${workshop.id}: tireFilters.seasons=${JSON.stringify(tireFilters?.seasons)}, using season="${seasonFilter}"`)
              console.log(`🔍 [DEBUG Tire Search] Workshop ${workshop.id}:`, {
                width: String(width),
                height: String(height),
                diameter: String(diameter),
                season: seasonFilter,
                vehicleType: 'PKW',
                requestedTireCount,
                runFlat: requireRunFlat || undefined,
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
                  minFuelEfficiency: tireFilters?.fuelEfficiency,
                  minWetGrip: tireFilters?.wetGrip,
                  threePMSF: tireFilters?.threePMSF,
                  showDOTTires: tireFilters?.showDOTTires,
                  runFlat: requireRunFlat || undefined,
                  minLoadIndex: loadIndex,
                  minSpeedIndex: speedIndex
                },
                requestedTireCount, // Pass the requested tire count
                0, // disposalFee NOT added to tire price
                requireRunFlat ? runFlatSurcharge : 0 // Pass runflat surcharge per tire
              )

              console.log(`📊 [DEBUG Tire Result] Workshop ${workshop.id}:`, {
                available: recsResult.available,
                recommendationsCount: recsResult.recommendations?.length || 0,
                firstRec: recsResult.recommendations?.[0] ? {
                  brand: recsResult.recommendations[0].brand,
                  model: recsResult.recommendations[0].model,
                  price: recsResult.recommendations[0].pricePerTire,
                  totalPrice: recsResult.recommendations[0].totalPrice
                } : null
              })

              if (recsResult.available && recsResult.recommendations.length > 0) {
                const defaultRec = recsResult.recommendations[0] // cheapest
                
                // Calculate disposal fee (added to montage, not to tires)
                const disposalFeeTotal = includeDisposal ? disposalFee * requestedTireCount : 0
                console.log(`💰 [Disposal Fee] Workshop ${workshop.id}: includeDisposal=${includeDisposal}, disposalFee=${disposalFee}, requestedTireCount=${requestedTireCount}, disposalFeeTotal=${disposalFeeTotal}`)
                
                const newTotalPrice = workshop.totalPrice + disposalFeeTotal + defaultRec.totalPrice
                console.log(`💵 [Total Price] Workshop ${workshop.id}: service=${workshop.totalPrice}, disposal=${disposalFeeTotal}, tires=${defaultRec.totalPrice}, TOTAL=${newTotalPrice}`)
                
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
                  // All recommendations for display
                  tireRecommendations: recsResult.recommendations.map(rec => ({
                    label: rec.label,
                    brand: rec.tire.brand,
                    model: rec.tire.model,
                    pricePerTire: rec.pricePerTire,
                    totalPrice: rec.totalPrice,
                    quantity: rec.quantity,
                    loadIndex: rec.tire.loadIndex || null,
                    speedIndex: rec.tire.speedIndex || null,
                    labelFuelEfficiency: rec.tire.labelFuelEfficiency || null,
                    labelWetGrip: rec.tire.labelWetGrip || null,
                    labelNoise: rec.tire.labelNoise || null,
                    threePMSF: rec.tire.threePMSF,
                    runFlat: rec.tire.runFlat,
                  })),
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
      // No tire search requested
      workshopsWithTires = workshopsWithDistance.map(workshop => ({
        ...workshop,
        tireAvailable: false,
        tirePrice: 0
      }))
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
