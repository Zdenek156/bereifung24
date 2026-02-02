const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const request = await prisma.tireRequest.findUnique({
    where: { id: 'cml3jujll0011dlybx2sdyrk7' }
  })
  
  const user = await prisma.user.findFirst({
    where: { email: 'antonmichl85@gmail.com' },
    include: { customer: true }
  })
  
  console.log('Request customerId:', request.customerId)
  console.log('Anton User ID:', user.id)
  console.log('Anton Customer ID:', user.customer?.id)
  console.log('MATCH:', request.customerId === user.customer?.id)
  
  await prisma.$disconnect()
}

check()
