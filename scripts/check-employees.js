const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const employees = await prisma.b24Employee.findMany({
    select: { id: true, email: true, firstName: true, lastName: true }
  })
  console.log(JSON.stringify(employees, null, 2))
  await prisma.$disconnect()
}

check()
