const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOffer() {
  const offerId = 'cmky1y02b00013c0mpmyd2b0h'  // From URL in screenshot
  
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      tireOptions: true,
      tireRequest: true
    }
  })
  
  if (!offer) {
    console.log('❌ Offer not found!')
    return
  }
  
  console.log('\n📦 OFFER DATA:')
  console.log('  ID:', offer.id)
  console.log('  Price (stored):', offer.price)
  console.log('  Installation Fee:', offer.installationFee)
  console.log('  selectedTireOptionIds:', offer.selectedTireOptionIds)
  console.log('  tireBrand:', offer.tireBrand)
  console.log('  tireModel:', offer.tireModel)
  
  console.log('\n🔧 TIRE OPTIONS:')
  offer.tireOptions.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt.brand} ${opt.model}`)
    console.log(`     - ID: ${opt.id}`)
    console.log(`     - Price per tire: ${opt.pricePerTire}€`)
    console.log(`     - Car Tire Type: ${opt.carTireType}`)
    console.log(`     - Selected: ${offer.selectedTireOptionIds?.includes(opt.id) ? '✅ YES' : '❌ NO'}`)
  })
  
  console.log('\n💰 PRICE CALCULATION:')
  if (offer.selectedTireOptionIds && offer.selectedTireOptionIds.length > 0) {
    const selectedOptions = offer.tireOptions.filter(opt => 
      offer.selectedTireOptionIds.includes(opt.id)
    )
    
    let tiresTotal = 0
    selectedOptions.forEach(opt => {
      const quantity = opt.carTireType === 'ALL_FOUR' ? 4 
                     : opt.carTireType === 'FRONT_TWO' ? 2 
                     : opt.carTireType === 'REAR_TWO' ? 2 
                     : offer.tireRequest.quantity || 2
      
      const optionTotal = opt.pricePerTire * quantity
      console.log(`  ${opt.brand} ${opt.model}: ${quantity}x ${opt.pricePerTire}€ = ${optionTotal}€`)
      tiresTotal += optionTotal
    })
    
    console.log(`  Tires Total: ${tiresTotal}€`)
    console.log(`  Installation Fee: ${offer.installationFee}€`)
    console.log(`  ───────────────────────`)
    console.log(`  CALCULATED TOTAL: ${tiresTotal + offer.installationFee}€`)
    console.log(`  STORED PRICE: ${offer.price}€`)
    
    if (Math.abs((tiresTotal + offer.installationFee) - offer.price) > 0.01) {
      console.log('  ⚠️  MISMATCH! Price should be updated!')
    } else {
      console.log('  ✅ Prices match!')
    }
  }
  
  await prisma.$disconnect()
}

checkOffer().catch(console.error)
