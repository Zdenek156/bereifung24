const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAllWorkshopsPayPal() {
  try {
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        paypalEmail: true
      }
    })
    
    console.log('All Workshops PayPal Configuration:')
    console.log('=====================================')
    
    workshops.forEach(workshop => {
      console.log(`\n${workshop.companyName}:`)
      console.log(`  ID: ${workshop.id}`)
      console.log(`  PayPal: ${workshop.paypalEmail || '❌ NOT CONFIGURED'}`)
    })
    
    const withPayPal = workshops.filter(w => w.paypalEmail)
    const withoutPayPal = workshops.filter(w => !w.paypalEmail)
    
    console.log('\n=====================================')
    console.log(`✅ ${withPayPal.length} workshops with PayPal`)
    console.log(`❌ ${withoutPayPal.length} workshops without PayPal`)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllWorkshopsPayPal()
