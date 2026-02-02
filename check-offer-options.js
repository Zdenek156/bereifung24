const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get Anton's customer
  const customer = await prisma.user.findUnique({
    where: {
      email: 'antonmichl85@gmail.com'
    }
  })
  
  if (!customer) {
    console.log('Anton not found!')
    return
  }
  
  // Get Anton's requests
  const requests = await prisma.tireRequest.findMany({
    where: {
      customerId: customer.id
    },
    include: {
      offers: {
        include: {
          tireOptions: true,
          workshop: {
            select: {
              companyName: true,
              taxMode: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 3
  })

  console.log('=== ANTON\'S RECENT REQUESTS ===\n')
  
  requests.forEach((request, i) => {
    console.log(`REQUEST #${i + 1}:`)
    console.log(`  ID: ${request.id}`)
    console.log(`  Service: ${request.additionalNotes?.includes('RÄDER UMSTECKEN') ? 'WHEEL_CHANGE' : 'OTHER'}`)
    console.log(`  Notes: ${request.additionalNotes?.substring(0, 100)}...`)
    console.log(`  Offers: ${request.offers.length}`)
    
    request.offers.forEach((offer, j) => {
      console.log(`\n  OFFER #${j + 1} (${offer.workshop.companyName}):`)
      console.log(`    Offer ID: ${offer.id}`)
      console.log(`    Total Price: ${offer.price} €`)
      console.log(`    Installation Fee: ${offer.installationFee} €`)
      console.log(`    Balancing Price: ${offer.balancingPrice} €`)
      console.log(`    Storage Price: ${offer.storagePrice} €`)
      console.log(`    Tax Mode: ${offer.workshop.taxMode}`)
      console.log(`    TireOptions: ${offer.tireOptions.length} options`)
      
      if (offer.tireOptions.length > 0) {
        offer.tireOptions.forEach((opt, k) => {
          console.log(`      Option #${k + 1}: ${opt.brand} ${opt.model}, Price: ${opt.pricePerTire} €`)
        })
      }
    })
    
    console.log('\n' + '='.repeat(50) + '\n')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
