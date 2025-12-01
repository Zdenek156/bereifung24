const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllRequests() {
  console.log('\n=== ALL TIRE REQUESTS (Last 10) ===\n')
  
  const allRequests = await prisma.tireRequest.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    include: {
      customer: true,
      offers: true
    }
  })
  
  console.log(`Total requests in database: ${allRequests.length}\n`)
  
  allRequests.forEach((req, idx) => {
    console.log(`Request ${idx + 1}:`)
    console.log(`  ID: ${req.id}`)
    console.log(`  Status: ${req.status}`)
    console.log(`  Created: ${req.createdAt}`)
    console.log(`  Customer ID: ${req.customerId}`)
    console.log(`  Location: ${req.latitude}, ${req.longitude}`)
    console.log(`  Offers: ${req.offers.length}`)
    console.log(`  Notes (first 200 chars):`)
    console.log(`  ${req.additionalNotes.substring(0, 200)}`)
    console.log()
  })
  
  console.log('\n=== CHECKING FOR MOTORCYCLE KEYWORDS ===\n')
  
  const motorcycleKeywords = ['Motorrad', 'Vorderreifen:', '✓ Vorderreifen:', 'Hinterreifen:']
  
  for (const keyword of motorcycleKeywords) {
    const count = allRequests.filter(r => r.additionalNotes?.includes(keyword)).length
    console.log(`Requests containing "${keyword}": ${count}`)
  }
  
  await prisma.$disconnect()
}

checkAllRequests().catch(console.error)
