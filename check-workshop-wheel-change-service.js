const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshopService() {
  try {
    // Get all workshops
    const workshops = await prisma.workshop.findMany({
      include: {
        user: {
          select: {
            email: true,
            companyName: true
          }
        },
        workshopServices: {
          where: {
            serviceType: 'WHEEL_CHANGE',
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

    console.log('🔍 Werkstätten mit WHEEL_CHANGE Service:\n')
    
    for (const workshop of workshops) {
      console.log(`\n📍 ${workshop.user.companyName || workshop.user.email}`)
      console.log(`   ID: ${workshop.id}`)
      
      if (workshop.workshopServices.length === 0) {
        console.log('   ❌ KEINE WHEEL_CHANGE Service konfiguriert')
      } else {
        const service = workshop.workshopServices[0]
        console.log(`   ✅ WHEEL_CHANGE Service vorhanden (ID: ${service.id})`)
        console.log(`   basePrice: ${service.basePrice}`)
        console.log(`   durationMinutes: ${service.durationMinutes}`)
        
        if (service.servicePackages.length === 0) {
          console.log('   ⚠️  KEINE Service-Pakete vorhanden!')
          console.log('   → ANFRAGEN WERDEN NICHT ANGEZEIGT')
        } else {
          console.log(`   📦 Service-Pakete (${service.servicePackages.length}):`)
          for (const pkg of service.servicePackages) {
            const hasPrice = pkg.price > 0
            const hasDuration = pkg.durationMinutes > 0
            const isValid = hasPrice && hasDuration
            
            console.log(`      ${isValid ? '✅' : '⚠️ '} ${pkg.name}`)
            console.log(`         Preis: ${pkg.price}€`)
            console.log(`         Dauer: ${pkg.durationMinutes} Min`)
            
            if (!isValid) {
              console.log('         ⚠️  UNGÜLTIG (Preis oder Dauer fehlt)')
            }
          }
          
          const hasValidPackages = service.servicePackages.some(
            pkg => pkg.price > 0 && pkg.durationMinutes > 0
          )
          
          if (hasValidPackages) {
            console.log('   ✅ ANFRAGEN WERDEN ANGEZEIGT')
          } else {
            console.log('   ❌ ANFRAGEN WERDEN NICHT ANGEZEIGT (keine gültigen Pakete)')
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopService()
