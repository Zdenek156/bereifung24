const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPackages() {
  try {
    console.log('Checking service packages...')
    
    const packages = await prisma.servicePackage.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        workshopService: {
          select: { 
            workshop: {
              select: { companyName: true }
            }
          }
        }
      }
    })
    
    console.log(`\nFound ${packages.length} packages:\n`)
    
    for (const pkg of packages) {
      console.log(`ID: ${pkg.id}`)
      console.log(`Workshop: ${pkg.workshopService?.workshop?.companyName || 'N/A'}`)
      console.log(`Service: ${pkg.serviceType}`)
      console.log(`Package: ${pkg.packageType}`)
      console.log(`Price: ${pkg.price}€`)
      console.log(`Duration: ${pkg.durationMinutes} min`)
      console.log(`Active: ${pkg.isActive}`)
      console.log(`---`)
    }
    
    // Count stats
    const totalCount = await prisma.servicePackage.count()
    const activeCount = await prisma.servicePackage.count({ where: { isActive: true } })
    const inactiveCount = await prisma.servicePackage.count({ where: { isActive: false } })
    const noPriceCount = await prisma.servicePackage.count({ where: { price: 0 } })
    
    console.log(`\nStatistics:`)
    console.log(`Total packages: ${totalCount}`)
    console.log(`Active: ${activeCount}`)
    console.log(`Inactive: ${inactiveCount}`)
    console.log(`With 0€ price: ${noPriceCount}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPackages()
