const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMuehlingPackages() {
  try {
    const muehling = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Mühling',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        companyName: true
      }
    })

    if (!muehling) {
      console.log('Workshop not found')
      return
    }

    console.log(`Workshop: ${muehling.companyName}`)
    console.log(`ID: ${muehling.id}\n`)

    // Get WHEEL_CHANGE service
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

    console.log('✅ WHEEL_CHANGE service found')
    console.log(`Service ID: ${service.id}`)
    console.log(`Is Active: ${service.isActive}`)
    console.log(`Base Price: ${service.basePrice}€`)
    console.log(`Base Price 4: ${service.basePrice4}€`)
    console.log(`Duration: ${service.durationMinutes}min`)
    console.log(`Duration 4: ${service.durationMinutes4}min`)
    console.log(`Balancing Price: ${service.balancingPrice}€`)
    console.log(`Storage Price: ${service.storagePrice}€`)
    console.log(`Storage Available: ${service.storageAvailable}\n`)

    // Get all packages
    const packages = await prisma.servicePackage.findMany({
      where: {
        workshopServiceId: service.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`\n=== Packages (${packages.length}) ===\n`)

    if (packages.length === 0) {
      console.log('❌ NO PACKAGES FOUND')
      console.log('\nThis is the problem! The service needs at least one active package.')
      console.log('\nRequired package structure for WHEEL_CHANGE:')
      console.log('- basic: Simple wheel change (no balancing, no storage)')
      console.log('- with_balancing: Wheel change + balancing')
      console.log('- with_storage: Wheel change + storage (optional if storage available)')
      console.log('- complete: Wheel change + balancing + storage (optional if storage available)')
    } else {
      for (const pkg of packages) {
        console.log(`Package: ${pkg.packageType}`)
        console.log(`  Name: ${pkg.name}`)
        console.log(`  Price: ${pkg.price}€`)
        console.log(`  Duration: ${pkg.durationMinutes}min`)
        console.log(`  Is Active: ${pkg.isActive}`)
        console.log(`  Description: ${pkg.description || 'N/A'}`)
        
        const isValid = pkg.isActive && pkg.price > 0 && pkg.durationMinutes > 0
        console.log(`  ✓ Valid: ${isValid ? '✅ YES' : '❌ NO'}`)
        
        if (!isValid) {
          if (!pkg.isActive) console.log('    → Problem: Package is not active')
          if (pkg.price <= 0) console.log('    → Problem: Price is 0 or negative')
          if (pkg.durationMinutes <= 0) console.log('    → Problem: Duration is 0 or negative')
        }
        console.log('')
      }

      const validPackages = packages.filter(pkg => 
        pkg.isActive && pkg.price > 0 && pkg.durationMinutes > 0
      )

      console.log(`\n=== Summary ===`)
      console.log(`Total Packages: ${packages.length}`)
      console.log(`Active Packages: ${packages.filter(p => p.isActive).length}`)
      console.log(`Valid Packages: ${validPackages.length}`)
      
      if (validPackages.length === 0) {
        console.log('\n❌ NO VALID PACKAGES!')
        console.log('Workshop cannot see WHEEL_CHANGE requests without at least one valid package.')
      } else {
        console.log('\n✅ Workshop should see WHEEL_CHANGE requests')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMuehlingPackages()
