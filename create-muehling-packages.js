const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createPackagesForMuehling() {
  try {
    const muehling = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Mühling',
          mode: 'insensitive'
        }
      }
    })

    if (!muehling) {
      console.log('❌ Workshop not found')
      return
    }

    const service = await prisma.workshopService.findFirst({
      where: {
        workshopId: muehling.id,
        serviceType: 'WHEEL_CHANGE'
      }
    })

    if (!service) {
      console.log('❌ WHEEL_CHANGE service not found')
      return
    }

    console.log(`Workshop: ${muehling.companyName}`)
    console.log(`Service found with:`)
    console.log(`- Base Price: ${service.basePrice}€`)
    console.log(`- Duration: ${service.durationMinutes}min`)
    console.log(`- Balancing Price: ${service.balancingPrice}€`)
    console.log(`- Storage Available: ${service.storageAvailable}`)
    console.log(`\nCreating packages...\n`)

    // Package 1: Basic (just wheel change, no balancing, no storage)
    const basicPackage = await prisma.servicePackage.create({
      data: {
        workshopServiceId: service.id,
        packageType: 'basic',
        name: 'Räder umstecken (Basis)',
        description: 'Einfaches Umstecken der komplett montierten Räder',
        price: service.basePrice,
        durationMinutes: service.durationMinutes,
        isActive: true
      }
    })
    console.log(`✅ Created: ${basicPackage.name} - ${basicPackage.price}€, ${basicPackage.durationMinutes}min`)

    // Package 2: With balancing (wheel change + balancing)
    if (service.balancingPrice && service.balancingPrice > 0) {
      const totalPrice = service.basePrice + (service.balancingPrice * 4) // 4 wheels
      const totalDuration = service.durationMinutes + ((service.balancingMinutes || 5) * 4) // 4 wheels
      
      const balancingPackage = await prisma.servicePackage.create({
        data: {
          workshopServiceId: service.id,
          packageType: 'with_balancing',
          name: 'Räder umstecken + Wuchten',
          description: 'Räder umstecken inklusive Auswuchten aller 4 Räder',
          price: totalPrice,
          durationMinutes: totalDuration,
          isActive: true
        }
      })
      console.log(`✅ Created: ${balancingPackage.name} - ${balancingPackage.price}€, ${balancingPackage.durationMinutes}min`)
    }

    // Package 3 & 4: Only if storage is available
    if (service.storageAvailable && service.storagePrice && service.storagePrice > 0) {
      // Package 3: With storage (wheel change + storage)
      const storagePackage = await prisma.servicePackage.create({
        data: {
          workshopServiceId: service.id,
          packageType: 'with_storage',
          name: 'Räder umstecken + Einlagerung',
          description: 'Räder umstecken inklusive saisonaler Einlagerung',
          price: service.basePrice + service.storagePrice,
          durationMinutes: service.durationMinutes + 10,
          isActive: true
        }
      })
      console.log(`✅ Created: ${storagePackage.name} - ${storagePackage.price}€, ${storagePackage.durationMinutes}min`)

      // Package 4: Complete (wheel change + balancing + storage)
      if (service.balancingPrice && service.balancingPrice > 0) {
        const totalPrice = service.basePrice + (service.balancingPrice * 4) + service.storagePrice
        const totalDuration = service.durationMinutes + ((service.balancingMinutes || 5) * 4) + 10
        
        const completePackage = await prisma.servicePackage.create({
          data: {
            workshopServiceId: service.id,
            packageType: 'complete',
            name: 'Räder umstecken Komplett',
            description: 'Räder umstecken inklusive Wuchten und Einlagerung',
            price: totalPrice,
            durationMinutes: totalDuration,
            isActive: true
          }
        })
        console.log(`✅ Created: ${completePackage.name} - ${completePackage.price}€, ${completePackage.durationMinutes}min`)
      }
    } else {
      console.log(`\n⚠️  Storage packages NOT created (storageAvailable: ${service.storageAvailable})`)
    }

    console.log(`\n✅ Done! Packages created successfully.`)
    console.log(`\nThe workshop should now see WHEEL_CHANGE requests!`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPackagesForMuehling()
