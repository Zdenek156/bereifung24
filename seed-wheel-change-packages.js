const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Seed WHEEL_CHANGE packages for all workshops
 * Based on TIRE_CHANGE structure + pricing estimates
 */
async function seedWheelChangePackages() {
  try {
    // Get all WHEEL_CHANGE services
    const wheelChangeServices = await prisma.workshopService.findMany({
      where: { serviceType: 'WHEEL_CHANGE' },
      include: { servicePackages: true }
    })

    console.log(`Found ${wheelChangeServices.length} WHEEL_CHANGE services\n`)

    for (const service of wheelChangeServices) {
      console.log(`\n=== Processing: ${service.workshopId} ===`)
      console.log(`Current packages: ${service.servicePackages.length}`)

      // Skip if already has all 4 packages
      if (service.servicePackages.length >= 4) {
        console.log('✓ Already has packages, skipping')
        continue
      }

      // Delete existing packages to start fresh
      if (service.servicePackages.length > 0) {
        await prisma.servicePackage.deleteMany({
          where: { serviceId: service.id }
        })
        console.log('Deleted existing packages')
      }

      // Define pricing based on current basePrice
      const basePrice = Number(service.basePrice)
      
      const packages = [
        {
          packageType: 'basic',
          name: 'Basis Räderwechsel',
          description: 'Einfacher Radwechsel ohne Zusatzleistungen',
          price: basePrice || 25, // Use basePrice or default 25 EUR
          durationMinutes: 30,
          isActive: true
        },
        {
          packageType: 'with_balancing',
          name: 'Mit Auswuchten',
          description: 'Räderwechsel inkl. Auswuchten für optimalen Rundlauf',
          price: (basePrice || 25) + 80, // +80 EUR für Auswuchten (4 Räder)
          durationMinutes: 50,
          isActive: true
        },
        {
          packageType: 'with_storage',
          name: 'Mit Einlagerung',
          description: 'Räderwechsel inkl. Einlagerung der Wechselräder',
          price: (basePrice || 25) + 120, // +120 EUR für Saison-Einlagerung
          durationMinutes: 40,
          isActive: true
        },
        {
          packageType: 'complete',
          name: 'Komplett-Service',
          description: 'Räderwechsel mit Auswuchten und Einlagerung',
          price: (basePrice || 25) + 200, // +200 EUR für beides
          durationMinutes: 60,
          isActive: true
        }
      ]

      // Create all packages
      for (const pkg of packages) {
        await prisma.servicePackage.create({
          data: {
            serviceId: service.id,
            ...pkg
          }
        })
        console.log(`✓ Created ${pkg.packageType}: ${pkg.price} EUR`)
      }

      console.log(`✅ Added 4 packages to service`)
    }

    console.log('\n\n=== SUMMARY ===')
    console.log('All WHEEL_CHANGE services now have dynamic pricing packages!')
    
  } catch (error) {
    console.error('Error seeding packages:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedWheelChangePackages()
