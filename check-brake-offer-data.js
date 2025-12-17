const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOfferData() {
  try {
    // Get latest offer with brake service (has tireOptions)
    const offer = await prisma.offer.findFirst({
      where: {
        selectedTireOptionIds: {
          isEmpty: false
        }
      },
      include: {
        tireRequest: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        tireOptions: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!offer) {
      console.log('❌ Kein Angebot mit selectedTireOptionIds gefunden')
      return
    }

    console.log('\n=== OFFER DETAILS ===')
    console.log('Offer ID:', offer.id)
    console.log('Created:', offer.createdAt)
    console.log('Price:', offer.price, '€')
    console.log('Selected Tire Option IDs:', offer.selectedTireOptionIds)

    console.log('\n=== TIRE REQUEST ===')
    console.log('Request ID:', offer.tireRequest.id)
    console.log('Additional Notes:', offer.tireRequest.additionalNotes)
    console.log('Width:', offer.tireRequest.width)
    console.log('Profile:', offer.tireRequest.profile)
    console.log('Diameter:', offer.tireRequest.diameter)
    console.log('Quantity:', offer.tireRequest.quantity)

    console.log('\n=== ALL TIRE OPTIONS ===')
    if (offer.tireOptions && offer.tireOptions.length > 0) {
      offer.tireOptions.forEach((opt, index) => {
        console.log(`\nOption ${index + 1}:`)
        console.log('  ID:', opt.id)
        console.log('  Brand:', opt.brand)
        console.log('  Model:', opt.model)
        console.log('  Price per tire:', opt.pricePerTire, '€')
        console.log('  Montage price:', opt.montagePrice, '€')
        console.log('  Total:', (opt.pricePerTire + opt.montagePrice), '€')
        console.log('  Description:', opt.description)
        console.log('  Selected?:', offer.selectedTireOptionIds?.includes(opt.id) ? '✅ JA' : '❌ NEIN')
      })
    } else {
      console.log('❌ Keine Tire Options gefunden!')
    }

    console.log('\n=== SELECTED OPTIONS ONLY ===')
    if (offer.selectedTireOptionIds && offer.selectedTireOptionIds.length > 0) {
      const selectedOptions = offer.tireOptions?.filter(opt => 
        offer.selectedTireOptionIds.includes(opt.id)
      ) || []
      
      selectedOptions.forEach((opt, index) => {
        console.log(`\nAusgewähltes Paket ${index + 1}:`)
        console.log('  Brand:', opt.brand)
        console.log('  Model:', opt.model)
        console.log('  Description:', opt.description)
        console.log('  Ersatzteile:', opt.pricePerTire, '€')
        console.log('  Montage:', opt.montagePrice, '€')
        console.log('  Summe:', (opt.pricePerTire + opt.montagePrice), '€')
      })
      
      const totalCalc = selectedOptions.reduce((sum, opt) => 
        sum + opt.pricePerTire + opt.montagePrice, 0
      )
      console.log('\n💰 Berechneter Gesamtpreis:', totalCalc, '€')
      console.log('💰 Gespeicherter offer.price:', offer.price, '€')
      console.log('⚠️ Differenz:', Math.abs(totalCalc - offer.price), '€')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOfferData()
