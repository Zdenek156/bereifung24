const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Deleting wrong conversion for zdenek156@gmail.com...')
  
  const customer = await prisma.customer.findFirst({
    where: {
      user: {
        email: 'zdenek156@gmail.com'
      }
    }
  })
  
  if (!customer) {
    console.log('Customer not found')
    return
  }
  
  const deleted = await prisma.affiliateConversion.deleteMany({
    where: {
      customerId: customer.id,
      type: 'REGISTRATION'
    }
  })
  
  console.log(`Deleted ${deleted.count} conversion(s)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
