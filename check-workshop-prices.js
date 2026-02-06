const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshopPrices() {
  try {
    // Finde alle Werkstätten mit Direct Booking Services
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            allowsDirectBooking: true,
            isActive: true
          }
        }
      },
      include: {
        workshopServices: {
          where: {
            allowsDirectBooking: true,
            isActive: true
          }
        },
        user: {
          select: {
            email: true
          }
        }
      },
      take: 5 // Nur erste 5 Werkstätten
    })

    console.log(`\n✅ Gefunden: ${workshops.length} Werkstätten mit Direct Booking\n`)

    for (const workshop of workshops) {
      console.log(`\n📍 Werkstatt: ${workshop.companyName}`)
      console.log(`   Email: ${workshop.user?.email}`)
      console.log(`   Services mit Direct Booking:`)

      for (const service of workshop.workshopServices) {
        console.log(`\n   🔧 ${service.serviceType}`)
        console.log(`      - basePrice: ${service.basePrice} (Type: ${typeof service.basePrice})`)
        console.log(`      - balancingPrice: ${service.balancingPrice} (Type: ${typeof service.balancingPrice})`)
        console.log(`      - storagePrice: ${service.storagePrice} (Type: ${typeof service.storagePrice})`)
        console.log(`      - allowsDirectBooking: ${service.allowsDirectBooking}`)
        console.log(`      - isActive: ${service.isActive}`)
        
        // Konvertiere zu Number wie in der API
        const basePrice = service.basePrice ? Number(service.basePrice) : 0
        const balancingPrice = service.balancingPrice ? Number(service.balancingPrice) : 0
        const storagePrice = service.storagePrice ? Number(service.storagePrice) : 0
        
        console.log(`\n      📊 Nach Number-Konvertierung:`)
        console.log(`      - basePrice: ${basePrice}€`)
        console.log(`      - balancingPrice: ${balancingPrice}€`)
        console.log(`      - storagePrice: ${storagePrice}€`)
        console.log(`      - Gesamt (base + bal*4 + storage): ${basePrice + (balancingPrice * 4) + storagePrice}€`)
      }
    }

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopPrices()
