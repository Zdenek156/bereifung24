const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Checking workshop services for motorcycle tires...\n')
  
  const workshops = await prisma.workshop.findMany({
    where: {
      workshopServices: {
        some: {
          serviceType: 'MOTORCYCLE_TIRE',
          isActive: true
        }
      }
    },
    select: {
      id: true,
      companyName: true,
      emailNotifyRequests: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      },
      workshopServices: {
        where: {
          serviceType: 'MOTORCYCLE_TIRE'
        }
      }
    }
  })

  console.log(`Found ${workshops.length} workshops offering motorcycle tires:\n`)
  
  if (workshops.length === 0) {
    console.log('❌ No workshops have activated the motorcycle tire service!')
    console.log('This is why no emails are sent.\n')
  } else {
    workshops.forEach(ws => {
      console.log(`Company: ${ws.companyName}`)
      console.log(`Email: ${ws.user.email}`)
      console.log(`Notifications enabled: ${ws.emailNotifyRequests}`)
      console.log(`Service active: ${ws.workshopServices[0]?.isActive}`)
      console.log('---\n')
    })
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
