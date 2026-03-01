const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPackages() {
  console.log('START CHECK')
  
  const workshops = await prisma.workshop.findMany({
    where: {
      workshopServices: {
        some: {
          serviceType: 'TIRE_CHANGE',
          isActive: true
        }
      }
    },
    include: {
      workshopServices: {
        where: {
          serviceType: 'TIRE_CHANGE',
          isActive: true
        },
        include: {
          servicePackages: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  })
  
  console.log(`Found ${workshops.length} workshops`)
  
  workshops.forEach(w => {
    console.log(`\nWorkshop: ${w.companyName} Status: ${w.status}`)
    const service = w.workshopServices.find(s => s.serviceType === 'TIRE_CHANGE')
    if (service && service.servicePackages) {
      console.log(`  Packages: ${service.servicePackages.length}`)
      service.servicePackages.forEach(pkg => {
        console.log(`    ${pkg.packageType}: ${pkg.price}`)
      })
    }
  })
  
  await prisma.$disconnect()
  console.log('DONE')
}

checkPackages().catch(err => {
  console.error('ERROR:', err.message)
  process.exit(1)
})
