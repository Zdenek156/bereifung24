const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Checking tire requests with OPEN or motorcycle in notes...\n')
  
  const requests = await prisma.tireRequest.findMany({
    where: {
      OR: [
        { status: 'OPEN' },
        { additionalNotes: { contains: 'MOTORRADREIFEN' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      createdAt: true,
      additionalNotes: true,
      customer: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  })

  console.log(`Found ${requests.length} requests:\n`)
  requests.forEach(req => {
    console.log(`ID: ${req.id}`)
    console.log(`Status: ${req.status}`)
    console.log(`Customer: ${req.customer.user.firstName} ${req.customer.user.lastName}`)
    console.log(`Created: ${req.createdAt}`)
    console.log(`Notes: ${req.additionalNotes?.substring(0, 100)}...`)
    console.log('---\n')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
