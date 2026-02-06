const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkServicePackages() {
  try {
    const directBookingServices = [
      'WHEEL_CHANGE',
      'TIRE_CHANGE', 
      'TIRE_REPAIR',
      'MOTORCYCLE_TIRE',
      'ALIGNMENT_BOTH',
      'CLIMATE_SERVICE'
    ]

    console.log('\n📦 SERVICE PACKAGES FÜR DIREKTBUCHUNG\n')
    console.log('================================================================================')

    for (const serviceType of directBookingServices) {
      console.log('\n🔧 ' + serviceType)
      console.log('--------------------------------------------------------------------------------')

      const packages = await prisma.servicePackage.findMany({
        where: {
          workshopService: {
            serviceType: serviceType,
            allowsDirectBooking: true,
            isActive: true
          },
          isActive: true
        },
        include: {
          workshopService: {
            select: {
              workshop: {
                select: {
                  companyName: true
                }
              }
            }
          }
        },
        take: 20
      })

      if (packages.length === 0) {
        console.log('   ❌ Keine Packages gefunden')
        continue
      }

      console.log('   ✅ ' + packages.length + ' Packages gefunden\n')

      const groupedByType = packages.reduce((acc, pkg) => {
        if (!acc[pkg.packageType]) {
          acc[pkg.packageType] = []
        }
        acc[pkg.packageType].push(pkg)
        return acc
      }, {})

      for (const [type, pkgs] of Object.entries(groupedByType)) {
        console.log('   📌 Package-Typ: ' + type)
        console.log('      Anzahl: ' + pkgs.length + ' Werkstätten')
        console.log('      Beispiel Name: "' + pkgs[0].name + '"')
        console.log('      Beispiel Beschreibung: "' + (pkgs[0].description || 'keine') + '"')
        console.log('      Preis-Bereich: ' + Math.min(...pkgs.map(p => Number(p.price))) + '€ - ' + Math.max(...pkgs.map(p => Number(p.price))) + '€')
        console.log('')
      }

      console.log('   📋 Verfügbare Package-Typen: ' + Object.keys(groupedByType).join(', '))
    }

    console.log('\n================================================================================')

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkServicePackages()
