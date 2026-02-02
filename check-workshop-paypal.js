const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get all workshops with their PayPal email
  const workshops = await prisma.workshop.findMany({
    select: {
      id: true,
      companyName: true,
      paypalEmail: true
    },
    orderBy: {
      companyName: 'asc'
    }
  })

  console.log('=== All Workshops and PayPal Emails ===\n')
  
  workshops.forEach((workshop, index) => {
    console.log(`${index + 1}. ${workshop.companyName}`)
    console.log(`   ID: ${workshop.id}`)
    console.log(`   PayPal: ${workshop.paypalEmail || '❌ NOT SET'}`)
    console.log('')
  })

  const withPayPal = workshops.filter(w => w.paypalEmail).length
  console.log(`Total: ${withPayPal} / ${workshops.length} workshops have PayPal email`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
