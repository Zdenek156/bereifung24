// Script to check existing TIRE_REPAIR service packages
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTireRepairPackages() {
  console.log('Checking TIRE_REPAIR packages in database...\n')

  try {
    // Find all TIRE_REPAIR services
    const services = await prisma.workshopService.findMany({
      where: {
        serviceType: 'TIRE_REPAIR'
      },
      include: {
        servicePackages: true,
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })

    if (services.length === 0) {
      console.log('⚠️  No TIRE_REPAIR services found in database')
      return
    }

    console.log(`Found ${services.length} TIRE_REPAIR service(s):\n`)

    services.forEach((service, index) => {
      console.log(`${index + 1}. Workshop: ${service.workshop.companyName}`)
      console.log(`   Service ID: ${service.id}`)
      console.log(`   Packages (${service.servicePackages.length}):`)
      
      service.servicePackages.forEach(pkg => {
        console.log(`   - [${pkg.packageType}] "${pkg.name}" (${pkg.isActive ? 'Active' : 'Inactive'})`)
        console.log(`     Description: ${pkg.description || 'N/A'}`)
        console.log(`     Price: €${pkg.price}, Duration: ${pkg.durationMinutes}min`)
      })
      console.log('')
    })
  } catch (error) {
    console.error('❌ Error checking packages:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkTireRepairPackages()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
