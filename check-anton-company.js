const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        user: {
          email: 'antonmichl85@gmail.com'
        }
      },
      include: {
        user: true
      }
    })
    
    if (customer) {
      console.log('\n=== CUSTOMER INFO ===')
      console.log('Email:', customer.user.email)
      console.log('isCompany:', customer.isCompany)
      console.log('companyName:', customer.companyName || 'N/A')
      console.log('===================\n')
    } else {
      console.log('Customer not found')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
