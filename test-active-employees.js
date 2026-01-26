const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const active = await prisma.b24Employee.findMany({
    where: {
      AND: [
        { status: { not: 'TERMINATED' } },
        { 
          NOT: [
            { email: { contains: 'admin@bereifung24.de', mode: 'insensitive' } },
            { email: { contains: 'system@', mode: 'insensitive' } }
          ]
        }
      ]
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      status: true
    }
  })

  console.log('=== ACTIVE EMPLOYEES (ohne admin@bereifung24.de) ===')
  console.log('Total:', active.length)
  active.forEach(e => {
    console.log(`${e.status}: ${e.firstName} ${e.lastName} (${e.email})`)
  })

  await prisma.$disconnect()
}

main()
