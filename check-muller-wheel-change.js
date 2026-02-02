const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMullerWheelChange() {
  try {
    console.log('=== MÜLLER WORKSHOP STATUS ===\n')
    
    // Find Müller workshop
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        workshopServices: {
          where: {
            serviceType: 'WHEEL_CHANGE'
          },
          include: {
            servicePackages: true
          }
        }
      }
    })

    if (!workshop) {
      console.log('❌ Workshop nicht gefunden!')
      return
    }

    console.log(`Workshop: ${workshop.user.name} (${workshop.user.email})`)
    console.log(`ID: ${workshop.id}\n`)

    // Check WHEEL_CHANGE service
    const wheelChangeService = workshop.workshopServices.find(s => s.serviceType === 'WHEEL_CHANGE')
    
    if (!wheelChangeService) {
      console.log('❌ WHEEL_CHANGE Service NICHT vorhanden!\n')
    } else {
      console.log('✅ WHEEL_CHANGE Service vorhanden:')
      console.log(`  Service ID: ${wheelChangeService.id}`)
      console.log(`  Aktiv: ${wheelChangeService.isActive}`)
      console.log(`  basePrice: ${wheelChangeService.basePrice}`)
      console.log(`  durationMinutes: ${wheelChangeService.durationMinutes}`)
      console.log(`  balancingPrice: ${wheelChangeService.balancingPrice}`)
      console.log(`  balancingMinutes: ${wheelChangeService.balancingMinutes}`)
      console.log(`  storagePrice: ${wheelChangeService.storagePrice}`)
      console.log(`  storageAvailable: ${wheelChangeService.storageAvailable}`)
      console.log(`  Packages: ${wheelChangeService.servicePackages.length}\n`)
      
      if (wheelChangeService.servicePackages.length > 0) {
        console.log('Packages:')
        wheelChangeService.servicePackages.forEach((pkg, i) => {
          console.log(`  ${i + 1}. ${pkg.name} (${pkg.packageType})`)
          console.log(`     Preis: ${pkg.price}€, Dauer: ${pkg.durationMinutes}min, Aktiv: ${pkg.isActive}`)
        })
        console.log()
      }
    }

    // Check WHEEL_CHANGE requests
    console.log('=== WHEEL_CHANGE ANFRAGEN ===\n')
    
    const wheelChangeRequests = await prisma.tireRequest.findMany({
      where: {
        serviceType: 'WHEEL_CHANGE'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    console.log(`Gesamt: ${wheelChangeRequests.length} WHEEL_CHANGE Anfragen\n`)

    if (wheelChangeRequests.length > 0) {
      wheelChangeRequests.forEach((req, i) => {
        console.log(`${i + 1}. Anfrage ${req.id.substring(0, 8)}...`)
        console.log(`   Von: ${req.user?.name || 'Unbekannt'} (${req.user?.email})`)
        console.log(`   Erstellt: ${req.createdAt.toLocaleString('de-DE')}`)
        console.log(`   Status: ${req.status}`)
        console.log()
      })
    }

    // Check what API would return
    console.log('=== API FILTER SIMULATION ===\n')
    
    const allServices = await prisma.workshopService.findMany({
      where: {
        workshopId: workshop.id,
        isActive: true
      },
      include: {
        servicePackages: true
      }
    })

    console.log(`Müller hat ${allServices.length} aktive Services:\n`)
    
    allServices.forEach(service => {
      const hasValidPackages = service.servicePackages.some(
        pkg => pkg.isActive && pkg.price > 0 && pkg.durationMinutes > 0
      )
      console.log(`  ${service.serviceType}: ${hasValidPackages ? '✅ Configured' : '❌ Not configured'}`)
      console.log(`    Packages: ${service.servicePackages.length}`)
      if (service.serviceType === 'WHEEL_CHANGE') {
        console.log(`    basePrice: ${service.basePrice}, duration: ${service.durationMinutes}`)
      }
    })

    const configuredServiceTypes = allServices
      .filter(service => 
        service.servicePackages.some(pkg => 
          pkg.isActive && pkg.price > 0 && pkg.durationMinutes > 0
        )
      )
      .map(service => service.serviceType)

    console.log(`\n📋 Configured Services (API würde filtern für): ${configuredServiceTypes.join(', ') || 'KEINE'}`)
    console.log(`\n🔍 WHEEL_CHANGE in configured list? ${configuredServiceTypes.includes('WHEEL_CHANGE') ? '✅ JA' : '❌ NEIN'}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMullerWheelChange()
