const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findOldPackages() {
  try {
    // Find all packages with old types
    const oldPackages = await prisma.servicePackage.findMany({
      where: {
        OR: [
          { packageType: 'both' },
          { packageType: 'front_disposal' },
          { packageType: 'rear_disposal' },
          { packageType: 'both_disposal' }
        ]
      },
      include: {
        workshopService: {
          include: {
            workshop: { include: { user: true } }
          }
        }
      }
    })
    
    console.log(`\n=== Found ${oldPackages.length} old motorcycle packages ===\n`)
    
    for (const pkg of oldPackages) {
      console.log(`Workshop: ${pkg.workshopService.workshop.companyName || pkg.workshopService.workshopId}`)
      console.log(`Service Type: ${pkg.workshopService.serviceType}`)
      console.log(`Package: ${pkg.packageType} - ${pkg.price} EUR - ${pkg.name}`)
      console.log(`Package ID: ${pkg.id}`)
      console.log(`Service ID: ${pkg.workshopServiceId}`)
      console.log()
    }
    
    if (oldPackages.length > 0) {
      console.log('Deleting old packages...')
      const result = await prisma.servicePackage.deleteMany({
        where: {
          OR: [
            { packageType: 'both' },
            { packageType: 'front_disposal' },
            { packageType: 'rear_disposal' },
            { packageType: 'both_disposal' }
          ]
        }
      })
      console.log(`✅ Deleted ${result.count} old packages`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findOldPackages()
