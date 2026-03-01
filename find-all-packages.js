const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findAllPackages() {
  try {
    // Find ALL service packages
    const allPackages = await prisma.servicePackage.findMany({
      include: {
        workshopService: {
          include: {
            workshop: { include: { user: true } }
          }
        }
      }
    })
    
    console.log(`\n=== Found ${allPackages.length} total ServicePackages ===\n`)
    
    // Group by workshop and service type
    const groupedByService = {}
    
    for (const pkg of allPackages) {
      const serviceId = pkg.workshopServiceId
      const serviceType = pkg.workshopService.serviceType
      const workshopName = pkg.workshopService.workshop.companyName || pkg.workshopService.workshopId
      
      if (!groupedByService[serviceId]) {
        groupedByService[serviceId] = {
          workshop: workshopName,
          serviceType: serviceType,
          serviceId: serviceId,
          packages: []
        }
      }
      
      groupedByService[serviceId].packages.push({
        type: pkg.packageType,
        price: pkg.price,
        duration: pkg.durationMinutes,
        active: pkg.isActive
      })
    }
    
    // Print grouped
    for (const [serviceId, data] of Object.entries(groupedByService)) {
      console.log(`\n${data.serviceType} - ${data.workshop}`)
      console.log(`Service ID: ${serviceId}`)
      console.log(`Packages (${data.packages.length}):`)
      data.packages.forEach(p => {
        console.log(`  - ${p.type}: ${p.price} EUR (${p.duration} Min) [${p.active ? 'ACTIVE' : 'INACTIVE'}]`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findAllPackages()
