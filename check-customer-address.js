const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCustomer() {
  console.log('\n=== CHECKING CUSTOMER DATA ===\n')
  
  // Get the customer from recent motorcycle requests
  const recentRequest = await prisma.tireRequest.findFirst({
    where: {
      additionalNotes: {
        contains: 'MOTORRADREIFEN'
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  if (!recentRequest) {
    console.log('No motorcycle requests found')
    return
  }
  
  const customer = await prisma.customer.findUnique({
    where: {
      id: recentRequest.customerId
    },
    include: {
      user: true
    }
  })
  
  if (!customer) {
    console.log('Customer not found')
    return
  }
  
  console.log('Customer ID:', customer.id)
  console.log('User ID:', customer.userId)
  console.log('User data:')
  console.log('  Email:', customer.user.email)
  console.log('  Name:', customer.user.name)
  console.log('  Street:', customer.user.street)
  console.log('  ZIP:', customer.user.zipCode)
  console.log('  City:', customer.user.city)
  console.log()
  
  if (!customer.user.street || !customer.user.city) {
    console.log('⚠️  PROBLEM: Customer address is incomplete!')
    console.log('   Street is required for geocoding')
  } else {
    console.log('✓ Customer address is complete')
  }
  
  await prisma.$disconnect()
}

checkCustomer().catch(console.error)
