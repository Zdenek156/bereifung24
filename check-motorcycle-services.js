const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkServices() {
  try {
    const services = await prisma.workshopService.findMany({
      where: { serviceType: 'MOTORCYCLE_TIRE' },
      include: { 
        workshop: { include: { user: true } },
        servicePackages: true 
      }
    })
    
    console.log(`\n=== Found ${services.length} MOTORCYCLE_TIRE services ===\n`)
    
    for (const service of services) {
      console.log(`Workshop: ${service.workshop.companyName || service.workshopId}`)
      console.log(`Service ID: ${service.id}`)
      console.log(`Packages (${service.servicePackages.length}):`)
      service.servicePackages.forEach(p => {
        console.log(`  - ${p.packageType}: ${p.price} EUR (${p.durationMinutes} Min) - ${p.isActive ? 'ACTIVE' : 'INACTIVE'}`)
      })
      console.log()
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkServices()
