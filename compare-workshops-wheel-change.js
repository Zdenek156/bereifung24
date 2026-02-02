const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function compareWorkshops() {
  try {
    // Get both workshops
    const mueller = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            companyName: true
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

    const muehling = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'reifen55@aol.com'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            companyName: true
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

    console.log('═══════════════════════════════════════════════════════')
    console.log('🔍 VERGLEICH: WHEEL_CHANGE Service bei beiden Werkstätten')
    console.log('═══════════════════════════════════════════════════════\n')

    // Müller (bikeanzeigen)
    console.log('📍 MÜLLER REIFENSERVICE (bikeanzeigen@gmail.com)')
    console.log('   Workshop ID:', mueller.id)
    
    if (mueller.workshopServices.length === 0) {
      console.log('   ❌ KEIN WHEEL_CHANGE Service vorhanden!\n')
    } else {
      const service = mueller.workshopServices[0]
      console.log('   ✅ WHEEL_CHANGE Service vorhanden')
      console.log('   Service ID:', service.id)
      console.log('   isActive:', service.isActive)
      console.log('   basePrice:', service.basePrice)
      console.log('   durationMinutes:', service.durationMinutes)
      console.log('   balancingPrice:', service.balancingPrice)
      console.log('   storagePrice:', service.storagePrice)
      console.log('   storageAvailable:', service.storageAvailable)
      console.log('   createdAt:', service.createdAt)
      console.log('   updatedAt:', service.updatedAt)
      
      console.log('\n   📦 Service-Pakete:', service.servicePackages.length)
      if (service.servicePackages.length === 0) {
        console.log('   ⚠️  KEINE PAKETE VORHANDEN!')
      } else {
        service.servicePackages.forEach((pkg, index) => {
          console.log(`\n   Paket ${index + 1}:`)
          console.log('      ID:', pkg.id)
          console.log('      packageType:', pkg.packageType)
          console.log('      name:', pkg.name)
          console.log('      price:', pkg.price)
          console.log('      durationMinutes:', pkg.durationMinutes)
          console.log('      isActive:', pkg.isActive)
          console.log('      createdAt:', pkg.createdAt)
        })
      }
    }

    console.log('\n───────────────────────────────────────────────────────\n')

    // Mühling (reifen55)
    console.log('📍 MÜHLING REIFENSERVICE (reifen55@aol.com)')
    console.log('   Workshop ID:', muehling.id)
    
    if (muehling.workshopServices.length === 0) {
      console.log('   ❌ KEIN WHEEL_CHANGE Service vorhanden!\n')
    } else {
      const service = muehling.workshopServices[0]
      console.log('   ✅ WHEEL_CHANGE Service vorhanden')
      console.log('   Service ID:', service.id)
      console.log('   isActive:', service.isActive)
      console.log('   basePrice:', service.basePrice)
      console.log('   durationMinutes:', service.durationMinutes)
      console.log('   balancingPrice:', service.balancingPrice)
      console.log('   storagePrice:', service.storagePrice)
      console.log('   storageAvailable:', service.storageAvailable)
      console.log('   createdAt:', service.createdAt)
      console.log('   updatedAt:', service.updatedAt)
      
      console.log('\n   📦 Service-Pakete:', service.servicePackages.length)
      if (service.servicePackages.length === 0) {
        console.log('   ⚠️  KEINE PAKETE VORHANDEN!')
      } else {
        service.servicePackages.forEach((pkg, index) => {
          console.log(`\n   Paket ${index + 1}:`)
          console.log('      ID:', pkg.id)
          console.log('      packageType:', pkg.packageType)
          console.log('      name:', pkg.name)
          console.log('      price:', pkg.price)
          console.log('      durationMinutes:', pkg.durationMinutes)
          console.log('      isActive:', pkg.isActive)
          console.log('      createdAt:', pkg.createdAt)
        })
      }
    }

    console.log('\n═══════════════════════════════════════════════════════')
    console.log('📊 ZUSAMMENFASSUNG')
    console.log('═══════════════════════════════════════════════════════')
    
    const muellerHasPackages = mueller?.workshopServices[0]?.servicePackages?.length > 0
    const muehlingHasPackages = muehling?.workshopServices[0]?.servicePackages?.length > 0
    
    console.log('\nMüller:', muellerHasPackages ? '✅ HAT Pakete' : '❌ KEINE Pakete')
    console.log('Mühling:', muehlingHasPackages ? '✅ HAT Pakete' : '❌ KEINE Pakete')
    
    if (!muellerHasPackages && muehlingHasPackages) {
      console.log('\n⚠️  PROBLEM: Müller hat keine Pakete, Mühling schon!')
      console.log('   → Müller sieht WHEEL_CHANGE Anfragen NICHT')
      console.log('   → Mühling sieht WHEEL_CHANGE Anfragen')
      
      console.log('\n🔧 MÖGLICHE URSACHEN:')
      console.log('   1. Service-Pakete wurden beim Erstellen nicht übergeben')
      console.log('   2. Frontend sendet "packages" nicht korrekt an die API')
      console.log('   3. WHEEL_CHANGE hat spezielle Behandlung in der UI')
      console.log('   4. Fehler beim Speichern wurde nicht angezeigt')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareWorkshops()
