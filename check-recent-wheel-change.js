const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Helper function to detect service type from request
// This matches the logic in app/dashboard/workshop/browse-requests/page.tsx
function detectServiceType(request) {
  const notes = request.additionalNotes || ''
  
  // Check for specific service markers in additionalNotes
  if (notes.includes('🏍️ MOTORRADREIFEN')) return 'MOTORCYCLE_TIRE'
  if (notes.includes('🔧 REIFENREPARATUR')) return 'TIRE_REPAIR'
  if (notes.includes('ACHSVERMESSUNG')) return 'ALIGNMENT_BOTH'
  if (notes.includes('BREMSEN-SERVICE')) return 'BRAKE_SERVICE'
  if (notes.includes('BATTERIE-SERVICE')) return 'BATTERY_SERVICE'
  if (notes.includes('KLIMASERVICE')) return 'CLIMATE_SERVICE'
  if (notes.includes('🔧 SONSTIGE REIFENSERVICES')) return 'OTHER_SERVICES'
  
  // Check for wheel change (width/aspectRatio/diameter all 0, but AFTER checking additionalNotes)
  if (request.width === 0 && request.aspectRatio === 0 && request.diameter === 0) {
    return 'WHEEL_CHANGE'
  }
  
  // Default: Tire change
  return 'TIRE_CHANGE'
}

async function checkRecentRequests() {
  try {
    // Get requests from last 3 hours
    const requests = await prisma.tireRequest.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 3 * 60 * 60 * 1000)
        }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    console.log(`\n=== Found ${requests.length} requests in last 3 hours ===\n`)

    for (const req of requests) {
      const serviceType = detectServiceType(req)
      console.log(`ID: ${req.id}`)
      console.log(`Detected Service: ${serviceType}`)
      console.log(`Width/Aspect/Diameter: ${req.width}/${req.aspectRatio}/${req.diameter}`)
      console.log(`Status: ${req.status}`)
      console.log(`Customer: ${req.customer?.user?.firstName} ${req.customer?.user?.lastName} (${req.customer?.user?.email})`)
      console.log(`Created: ${req.createdAt}`)
      console.log(`Notes: ${req.additionalNotes || 'NONE'}`)
      console.log('---\n')
    }

    // Check specifically for "Reifenservice Mühling"
    console.log('\n=== Checking Reifenservice Mühling ===\n')
    const muehling = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Mühling',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        companyName: true,
        user: {
          select: {
            email: true,
            zipCode: true,
            city: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })

    if (muehling) {
      console.log('Workshop found:', muehling.companyName)
      console.log('Email:', muehling.user?.email)
      console.log('Location:', muehling.user?.zipCode, muehling.user?.city)
      console.log('Coordinates:', muehling.user?.latitude, muehling.user?.longitude)
      
      // Check if workshop has WHEEL_CHANGE service
      const service = await prisma.workshopService.findFirst({
        where: {
          workshopId: muehling.id,
          serviceType: 'WHEEL_CHANGE'
        },
        include: {
          servicePackages: {
            where: {
              isActive: true
            }
          }
        }
      })

      console.log('\nWHEEL_CHANGE Service:', service ? 'EXISTS' : 'NOT FOUND')
      if (service) {
        console.log('Is Active:', service.isActive)
        console.log('Active Packages:', service.servicePackages.length)
        
        if (service.servicePackages.length > 0) {
          console.log('\nPackages:')
          service.servicePackages.forEach(pkg => {
            console.log(`  - ${pkg.packageType}: ${pkg.name}`)
            console.log(`    Price: ${pkg.price}€, Duration: ${pkg.durationMinutes}min`)
            console.log(`    Active: ${pkg.isActive}`)
            console.log(`    Valid: ${pkg.isActive && pkg.price > 0 && pkg.durationMinutes > 0 ? 'YES' : 'NO'}`)
          })
          
          const hasValidPackages = service.servicePackages.some(pkg => 
            pkg.isActive && pkg.price > 0 && pkg.durationMinutes > 0
          )
          console.log(`\n  Has valid packages: ${hasValidPackages}`)
          
          if (!hasValidPackages) {
            console.log('\n  ❌ PROBLEM: No valid packages with price > 0 and duration > 0')
            console.log('  This is why workshop cannot see WHEEL_CHANGE requests!')
          }
        } else {
          console.log('\n  ❌ PROBLEM: No active packages configured')
          console.log('  This is why workshop cannot see WHEEL_CHANGE requests!')
        }
      } else {
        console.log('\n  ❌ PROBLEM: WHEEL_CHANGE service not configured at all')
        console.log('  Workshop needs to configure WHEEL_CHANGE service first!')
      }

      // Check requests for this workshop (filtered by WHEEL_CHANGE)
      const allRequests = await prisma.tireRequest.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const wheelChangeRequests = allRequests.filter(req => {
        const serviceType = detectServiceType(req)
        return serviceType === 'WHEEL_CHANGE'
      })

      console.log(`\nAll requests in last 24h: ${allRequests.length}`)
      console.log(`WHEEL_CHANGE requests: ${wheelChangeRequests.length}`)
      
      for (const req of wheelChangeRequests) {
        console.log(`  - ID: ${req.id}`)
        console.log(`    Customer: ${req.customer?.user?.firstName} ${req.customer?.user?.lastName}`)
        console.log(`    Status: ${req.status}`)
        console.log(`    Created: ${req.createdAt}`)
        console.log(`    Width/Aspect/Diameter: ${req.width}/${req.aspectRatio}/${req.diameter}`)
        console.log(`    ZIP: ${req.zipCode}`)
      }
    } else {
      console.log('Workshop NOT FOUND')
      
      // List all workshops with similar names
      const similar = await prisma.workshop.findMany({
        where: {
          OR: [
            { companyName: { contains: 'Reifen', mode: 'insensitive' } },
            { companyName: { contains: 'Mühl', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          companyName: true,
          email: true
        },
        take: 10
      })
      
      console.log('\nSimilar workshops:', similar)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRecentRequests()
