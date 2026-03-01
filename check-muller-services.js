const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking Müller Reifenservice services...\n')

    const muller = await prisma.workshop.findFirst({
      where: { companyName: { contains: 'Müller' } },
      include: {
        workshopServices: {
          include: {
            servicePackages: true
          }
        },
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!muller) {
      console.log('❌ Müller Reifenservice not found')
      return
    }

    console.log('📍 Workshop:', muller.companyName)
    console.log('📧 Email:', muller.user.email)
    console.log(`\n📋 Services (${muller.workshopServices.length} total):\n`)

    muller.workshopServices.forEach((service, idx) => {
      console.log(`${idx + 1}. ${service.serviceType}`)
      console.log(`   - isActive: ${service.isActive}`)
      console.log(`   - Packages: ${service.servicePackages.length}`)
      service.servicePackages.forEach(pkg => {
        console.log(`     * ${pkg.name}: ${pkg.price}€ (active: ${pkg.isActive})`)
      })
      console.log('')
    })

    // Compare with Luxus24
    console.log('\n🔍 Comparing with Luxus24...\n')
    
    const luxus = await prisma.workshop.findFirst({
      where: { companyName: { contains: 'Luxus' } },
      include: {
        workshopServices: true
      }
    })

    if (luxus) {
      console.log('📍 Luxus24:')
      console.log(`   Services: ${luxus.workshopServices.length}`)
      luxus.workshopServices.forEach(s => {
        console.log(`   - ${s.serviceType} (active: ${s.isActive})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
