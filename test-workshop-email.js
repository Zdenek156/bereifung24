const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testWorkshopEmail() {
  console.log('\n=== TESTING WORKSHOP EMAIL CONFIGURATION ===\n')
  
  // Get workshops with MOTORCYCLE_TIRE service
  const workshops = await prisma.workshop.findMany({
    where: {
      workshopServices: {
        some: {
          serviceType: 'MOTORCYCLE_TIRE',
          isActive: true
        }
      }
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  })
  
  console.log(`Found ${workshops.length} workshops with MOTORCYCLE_TIRE service:\n`)
  
  workshops.forEach((ws, idx) => {
    console.log(`Workshop ${idx + 1}:`)
    console.log(`  ID: ${ws.id}`)
    console.log(`  Company: ${ws.companyName}`)
    console.log(`  User Email: ${ws.user?.email || 'NO EMAIL'}`)
    console.log(`  emailNotifyRequests: ${ws.emailNotifyRequests}`)
    console.log(`  Will receive email: ${ws.user?.email && ws.emailNotifyRequests ? 'YES ✓' : 'NO ✗'}`)
    console.log()
  })
  
  // Check most recent motorcycle request
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
  
  if (recentRequest) {
    console.log('Most recent motorcycle request:')
    console.log(`  ID: ${recentRequest.id}`)
    console.log(`  Created: ${recentRequest.createdAt}`)
    console.log(`  Has coordinates: ${recentRequest.latitude && recentRequest.longitude ? 'YES' : 'NO'}`)
    console.log(`  Latitude: ${recentRequest.latitude}`)
    console.log(`  Longitude: ${recentRequest.longitude}`)
  }
  
  await prisma.$disconnect()
}

testWorkshopEmail().catch(console.error)
