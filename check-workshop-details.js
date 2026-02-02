const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get session user (assuming you're logged in as workshop)
  const workshops = await prisma.workshop.findMany({
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  })

  console.log('=== Workshops with User Emails ===\n')
  workshops.forEach(workshop => {
    console.log(`Workshop: ${workshop.companyName}`)
    console.log(`  ID: ${workshop.id}`)
    console.log(`  User Email: ${workshop.user?.email || 'N/A'}`)
    console.log(`  PayPal Email: ${workshop.paypalEmail || '❌ NOT SET'}`)
    console.log(`  Payment Methods: ${workshop.paymentMethods || 'N/A'}`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)
