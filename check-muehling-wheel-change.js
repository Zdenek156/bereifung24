const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMuehlingWheelChange() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { 
        user: { email: 'reifen55@aol.com' } 
      },
      include: {
        workshopServices: {
          where: { serviceType: 'WHEEL_CHANGE' },
          include: { servicePackages: true }
        }
      }
    })

    if (!workshop) {
      console.log('Mühling Workshop nicht gefunden')
      return
    }

    const wheelChangeService = workshop.workshopServices[0]
    if (!wheelChangeService) {
      console.log('Kein WHEEL_CHANGE Service gefunden')
      return
    }

    console.log('\n=== MÜHLING WHEEL_CHANGE SERVICE ===')
    console.log('Service ID:', wheelChangeService.id)
    console.log('Service Type:', wheelChangeService.serviceType)
    console.log('Active:', wheelChangeService.isActive)
    console.log('\n--- Felder ---')
    console.log('basePrice:', wheelChangeService.basePrice)
    console.log('durationMinutes:', wheelChangeService.durationMinutes)
    console.log('balancingPrice:', wheelChangeService.balancingPrice)
    console.log('balancingMinutes:', wheelChangeService.balancingMinutes)
    console.log('storagePrice:', wheelChangeService.storagePrice)
    console.log('storageAvailable:', wheelChangeService.storageAvailable)
    
    console.log('\n--- Service Packages (' + wheelChangeService.servicePackages.length + ') ---')
    wheelChangeService.servicePackages.forEach((pkg, idx) => {
      console.log(`\nPackage ${idx + 1}:`)
      console.log('  ID:', pkg.id)
      console.log('  Type:', pkg.packageType)
      console.log('  Name:', pkg.name)
      console.log('  Price:', pkg.price)
      console.log('  Duration:', pkg.durationMinutes)
      console.log('  Active:', pkg.isActive)
    })

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMuehlingWheelChange()
