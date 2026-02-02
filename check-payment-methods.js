const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPaymentMethods() {
  try {
    const workshop = await prisma.workshop.findFirst({
      include: { 
        user: { 
          select: { email: true } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    })
    
    if (workshop) {
      console.log('=== Workshop Payment Methods Check ===')
      console.log('Workshop:', workshop.companyName)
      console.log('Email:', workshop.user.email)
      console.log('PayPal Email:', workshop.paypalEmail)
      console.log('Stripe Enabled:', workshop.stripeEnabled)
      console.log('Payment Methods (raw):', workshop.paymentMethods)
      console.log('Type:', typeof workshop.paymentMethods)
      
      if (workshop.paymentMethods) {
        try {
          const parsed = typeof workshop.paymentMethods === 'string' 
            ? JSON.parse(workshop.paymentMethods)
            : workshop.paymentMethods
          console.log('Parsed Payment Methods:', JSON.stringify(parsed, null, 2))
        } catch (e) {
          console.log('Parse error:', e.message)
        }
      } else {
        console.log('⚠️ paymentMethods is NULL or empty')
      }
    } else {
      console.log('No workshop found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPaymentMethods()
