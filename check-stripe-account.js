const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStripeAccount() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: {
        stripeAccountId: 'acct_1SygKtRs03neuxfQ'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (workshop) {
      console.log('🔍 Workshop with invalid Stripe Account ID:')
      console.log('ID:', workshop.id)
      console.log('Name:', workshop.companyName)
      console.log('User:', workshop.user.name)
      console.log('Email:', workshop.user.email)
      console.log('Stripe Account ID:', workshop.stripeAccountId)
      console.log('\n❌ This Account ID is not connected to the platform!')
      console.log('✅ Workshop needs to delete this ID and re-onboard')
    } else {
      console.log('No workshop found with this Account ID')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStripeAccount()
