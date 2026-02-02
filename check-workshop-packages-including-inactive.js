const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshopPackages() {
  try {
    // Get bikeanzeigen workshop
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            companyName: true
          }
        },
        workshopServices: {
          where: {
            serviceType: 'WHEEL_CHANGE'
          },
          include: {
            servicePackages: true // ALLE, auch inaktive
          }
        }
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }

    console.log(`\n📍 ${workshop.user.companyName || workshop.user.email}`)
    console.log(`   Workshop ID: ${workshop.id}`)
    console.log(`   User ID: ${workshop.userId}`)
    
    if (workshop.workshopServices.length === 0) {
      console.log('   ❌ KEINE WHEEL_CHANGE Service konfiguriert')
    } else {
      const service = workshop.workshopServices[0]
      console.log(`\n   ✅ WHEEL_CHANGE Service:`)
      console.log(`      Service ID: ${service.id}`)
      console.log(`      isActive: ${service.isActive}`)
      console.log(`      basePrice: ${service.basePrice}€`)
      console.log(`      durationMinutes: ${service.durationMinutes} Min`)
      
      console.log(`\n   📦 Service-Pakete (${service.servicePackages.length} gesamt):`)
      
      if (service.servicePackages.length === 0) {
        console.log('      ⚠️  KEINE Service-Pakete gefunden!')
        console.log('      → Gehe zu Dashboard → Meine Dienstleistungen → Räder umstecken → Service-Pakete hinzufügen')
      } else {
        for (const pkg of service.servicePackages) {
          console.log(`\n      ${pkg.isActive ? '✅' : '❌'} ${pkg.name}`)
          console.log(`         Package ID: ${pkg.id}`)
          console.log(`         isActive: ${pkg.isActive}`)
          console.log(`         Preis: ${pkg.price}€`)
          console.log(`         Dauer: ${pkg.durationMinutes} Min`)
        }
        
        const activePackages = service.servicePackages.filter(pkg => pkg.isActive)
        const validPackages = activePackages.filter(pkg => pkg.price > 0 && pkg.durationMinutes > 0)
        
        console.log(`\n   📊 Zusammenfassung:`)
        console.log(`      Gesamt: ${service.servicePackages.length}`)
        console.log(`      Aktiv: ${activePackages.length}`)
        console.log(`      Gültig (Preis & Dauer): ${validPackages.length}`)
        
        if (validPackages.length > 0) {
          console.log(`\n   ✅ WHEEL_CHANGE Anfragen SOLLTEN sichtbar sein`)
        } else {
          console.log(`\n   ❌ WHEEL_CHANGE Anfragen NICHT sichtbar (keine gültigen aktiven Pakete)`)
        }
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopPackages()
