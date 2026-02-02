const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addTireChangeService() {
  try {
    const luxus24 = await prisma.workshop.findFirst({
      where: { companyName: { contains: 'Luxus24', mode: 'insensitive' } }
    })

    if (!luxus24) {
      console.log('❌ Luxus24 nicht gefunden!')
      return
    }

    // Check if TIRE_CHANGE already exists
    const existing = await prisma.workshopService.findFirst({
      where: {
        workshopId: luxus24.id,
        serviceType: 'TIRE_CHANGE'
      }
    })

    if (existing) {
      console.log('✅ TIRE_CHANGE Service existiert bereits')
      console.log(`   Status: ${existing.isActive ? 'Aktiv' : 'Inaktiv'}`)
      
      if (!existing.isActive) {
        await prisma.workshopService.update({
          where: { id: existing.id },
          data: { isActive: true }
        })
        console.log('✅ TIRE_CHANGE wurde aktiviert!')
      }
    } else {
      // Create TIRE_CHANGE service
      await prisma.workshopService.create({
        data: {
          workshopId: luxus24.id,
          serviceType: 'TIRE_CHANGE',
          basePrice: 40.00, // Preis für 2 Reifen
          basePrice4: 70.00, // Preis für 4 Reifen
          runFlatSurcharge: 10.00, // Aufpreis pro Runflat-Reifen
          disposalFee: 5.00, // Entsorgung pro Reifen
          durationMinutes: 30, // Dauer für 2 Reifen
          durationMinutes4: 50, // Dauer für 4 Reifen
          isActive: true
        }
      })
      console.log('✅ TIRE_CHANGE Service wurde erstellt und aktiviert!')
    }

    console.log('\n=== Aktive Services von Luxus24 ===')
    const services = await prisma.workshopService.findMany({
      where: {
        workshopId: luxus24.id,
        isActive: true
      },
      select: {
        serviceType: true,
        basePrice: true,
        basePrice4: true
      }
    })

    services.forEach(s => {
      console.log(`- ${s.serviceType}: ${s.basePrice}€ (2 Stück) / ${s.basePrice4}€ (4 Stück)`)
    })

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTireChangeService()
