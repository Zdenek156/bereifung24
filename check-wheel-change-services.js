const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWheelChangeServices() {
  try {
    const services = await prisma.workshopService.findMany({
      where: { serviceType: 'WHEEL_CHANGE' },
      include: { 
        servicePackages: {
          where: { isActive: true }
        },
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })
    
    console.log('WHEEL_CHANGE Services found:', services.length)
    
    services.forEach(service => {
      console.log('\n===================')
      console.log('Workshop:', service.workshop.companyName)
      console.log('Service ID:', service.id)
      console.log('Base Price:', service.basePrice?.toString())
      console.log('Packages:', service.servicePackages.length)
      
      service.servicePackages.forEach(pkg => {
        console.log(`  - ${pkg.packageType}: ${pkg.price.toString()} EUR (${pkg.durationMinutes} Min)`)
      })
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWheelChangeServices()
