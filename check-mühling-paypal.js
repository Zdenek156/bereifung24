const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMühlingPayPal() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Mühling'
        }
      },
      select: {
        id: true,
        companyName: true,
        paypalEmail: true
      }
    })
    
    console.log('Mühling Workshop PayPal Configuration:')
    console.log(JSON.stringify(workshop, null, 2))
    
    if (!workshop) {
      console.log('⚠️ Workshop not found!')
    } else if (!workshop.paypalEmail) {
      console.log('⚠️ No PayPal email configured for Mühling workshop!')
      console.log('   To enable PayPal, add paypalEmail to workshop settings')
    } else {
      console.log('✅ PayPal email is configured:', workshop.paypalEmail)
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMühlingPayPal()
