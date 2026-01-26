const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmployees() {
  const employees = await prisma.b24Employee.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log('=== ALL EMPLOYEES ===')
  console.log(`Total: ${employees.length}\n`)

  const byStatus = {}
  employees.forEach(emp => {
    const status = emp.status || 'ACTIVE'
    if (!byStatus[status]) byStatus[status] = []
    byStatus[status].push(emp)
    console.log(`${status}: ${emp.firstName} ${emp.lastName} (${emp.email})`)
  })

  console.log('\n=== BY STATUS ===')
  Object.keys(byStatus).forEach(status => {
    console.log(`${status}: ${byStatus[status].length}`)
  })

  await prisma.$disconnect()
}

checkEmployees().catch(console.error)
