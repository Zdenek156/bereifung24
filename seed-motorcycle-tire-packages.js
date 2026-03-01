const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Seed MOTORCYCLE_TIRE packages for all workshops
 * Vorderrad, Hinterrad, Beide Räder (jeweils mit/ohne Entsorgung)
 */
async function seedMotorcycleTirePackages() {
  try {
    // Get all MOTORCYCLE_TIRE services
    const motorcycleServices = await prisma.workshopService.findMany({
      where: { serviceType: 'MOTORCYCLE_TIRE' },
      include: { servicePackages: true }
    })

    console.log(`Found ${motorcycleServices.length} MOTORCYCLE_TIRE services\n`)

    for (const service of motorcycleServices) {
      console.log(`\n=== Processing: ${service.workshopId} ===`)
      console.log(`Current packages: ${service.servicePackages.length}`)

      // Delete existing packages if not exactly 3 (to update structure)
      if (service.servicePackages.length > 0) {
        await prisma.servicePackage.deleteMany({
          where: { workshopServiceId: service.id }
        })
        console.log('Deleted existing packages to update structure')
      }

      // Define pricing based on current basePrice
      const basePrice = Number(service.basePrice) || 30 // Default 30 EUR for motorcycle tire
      const disposalFee = 3.50 // Altreifenentsorgung pro Reifen
      
      const packages = [
        {
          packageType: 'front',
          name: 'Vorderrad',
          description: 'Reifenwechsel am ausgebauten Vorderrad (nur Felge)',
          price: basePrice,
          durationMinutes: 30,
          isActive: true
        },
        {
          packageType: 'rear',
          name: 'Hinterrad',
          description: 'Reifenwechsel am ausgebauten Hinterrad (nur Felge)',
          price: basePrice,
          durationMinutes: 30,
          isActive: true
        },
        {
          packageType: 'disposal',
          name: 'Altreifenentsorgung',
          description: 'Umweltgerechte Entsorgung pro Reifen',
          price: disposalFee,
          durationMinutes: 0, // No extra time
          isActive: true
        }
      ]

      // Create all packages
      for (const pkg of packages) {
        await prisma.servicePackage.create({
          data: {
            workshopServiceId: service.id,
            ...pkg
          }
        })
        console.log(`✓ Created ${pkg.packageType}: ${pkg.price.toFixed(2)} EUR`)
      }

      console.log(`✅ Added 3 packages to service`)
    }

    console.log('\n\n=== SUMMARY ===')
    console.log('All MOTORCYCLE_TIRE services now have packages!')
    console.log('Packages: front (Vorderrad), rear (Hinterrad), disposal (Entsorgung)')
    console.log('Preise werden im Code multipliziert für "beide Räder"')
    
  } catch (error) {
    console.error('Error seeding packages:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedMotorcycleTirePackages()
