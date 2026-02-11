const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listCustomers() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, email: true, firstName: true, lastName: true },
    take: 10
  })
  
  console.log('Customer users:')
  console.log(JSON.stringify(users, null, 2))
  
  await prisma.$disconnect()
}

listCustomers().catch(console.error)
