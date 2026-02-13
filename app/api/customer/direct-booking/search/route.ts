import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findCheapestTire } from '@/lib/services/tireSearchService'

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
      tireFilters
    } = body

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
          where: {
            review: { isNot: null }
          },
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
        const mainPackageTypes = ['two_tires', 'four_tires', 'basic', 'with_balancing', 'with_storage', 'complete',
                                   'measurement_front', 'measurement_rear', 'measurement_both',
                                   'adjustment_front', 'adjustment_rear', 'adjustment_both', 'full_service',
                                   'foreign_object', 'valve_damage', 'front', 'rear', 'both',
                                   'check', 'basic', 'comfort', 'premium']
        const additionalServices = ['with_disposal', 'runflat']
        
        // Get selected main package and additional services
        const selectedMainPackages = packageTypes.filter(pt => mainPackageTypes.includes(pt))
        const selectedAdditionalServices = packageTypes.filter(pt => additionalServices.includes(pt))
        
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
          if (selectedMainPackages.length > 0) {
            relevantPackages = relevantPackages.filter(pkg => 
              pkg.isActive && selectedMainPackages.includes(pkg.packageType)
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
            }
          } else {
            basePrice = service.basePrice ? Number(service.basePrice) : 0
          }
        } else {
          basePrice = service.basePrice ? Number(service.basePrice) : 0
        }
        
        // Add additional service fees (multiplied by tire count)
        let additionalFees = 0
        if (serviceType === 'TIRE_CHANGE' && tireCount > 0) {
          if (selectedAdditionalServices.includes('with_disposal') && service.disposalFee) {
            additionalFees += Number(service.disposalFee) * tireCount
          }
          if (selectedAdditionalServices.includes('runflat') && service.runFlatSurcharge) {
            additionalFees += Number(service.runFlatSurcharge) * tireCount
          }
        }
        
        const totalPrice = basePrice + additionalFees
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

    if (includeTires && tireDimensions) {
      const { width, height, diameter } = tireDimensions
      
      if (width && height && diameter) {
        // Fetch tire prices for each workshop
        workshopsWithTires = await Promise.all(
          workshopsWithDistance.map(async (workshop) => {
            try {
              const cheapestTireResult = await findCheapestTire(
                workshop.id,
                width,
                height,
                diameter,
                tireFilters?.seasons?.[0] || 'all', // Use first selected season or all
                'PKW' // Default to cars, could be passed as parameter
              )

              if (cheapestTireResult.available) {
                return {
                  ...workshop,
                  // Tire information
                  tirePrice: cheapestTireResult.totalPrice,
                  tirePricePerTire: cheapestTireResult.pricePerTire,
                  tireQuantity: cheapestTireResult.quantity,
                  tireBrand: cheapestTireResult.tire?.brand,
                  tireModel: cheapestTireResult.tire?.model,
                  tireAvailable: true,
                  // Update total price (service + tires)
                  totalPrice: workshop.totalPrice + cheapestTireResult.totalPrice,
                }
              } else {
                // No tires available for this workshop
                return {
                  ...workshop,
                  tireAvailable: false,
                  tirePrice: 0,
                }
              }
            } catch (error) {
              console.error(`Error fetching tires for workshop ${workshop.id}:`, error)
              return {
                ...workshop,
                tireAvailable: false,
                tirePrice: 0,
              }
            }
          })
        )
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
