const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugMotorcycle() {
  console.log('\n=== CHECKING MOTORCYCLE REQUESTS ===\n')
  
  // Get all motorcycle requests
  const requests = await prisma.tireRequest.findMany({
    where: {
      additionalNotes: {
        contains: 'Motorradreifen'
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      customer: {
        select: {
          id: true,
          userId: true
        }
      },
      offers: true
    }
  })
  
  console.log(`Found ${requests.length} motorcycle requests:\n`)
  
  requests.forEach((req, idx) => {
    console.log(`Request ${idx + 1}:`)
    console.log(`  ID: ${req.id}`)
    console.log(`  Status: ${req.status}`)
    console.log(`  Created: ${req.createdAt}`)
    console.log(`  Customer ID: ${req.customer.id}`)
    console.log(`  Location: ${req.latitude}, ${req.longitude}`)
    console.log(`  Address: ${req.address}`)
    console.log(`  Offers: ${req.offers.length}`)
    console.log(`  Notes: ${req.additionalNotes.substring(0, 150)}...`)
    console.log()
  })
  
  console.log('\n=== CHECKING WORKSHOP CONFIGURATION ===\n')
  
  // Get workshop with motorcycle service
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
      workshopServices: {
        where: {
          serviceType: 'MOTORCYCLE_TIRE'
        }
      }
    }
  })
  
  console.log(`Found ${workshops.length} workshops with motorcycle service:\n`)
  
  workshops.forEach((ws, idx) => {
    console.log(`Workshop ${idx + 1}:`)
    console.log(`  ID: ${ws.id}`)
    console.log(`  Name: ${ws.companyName}`)
    console.log(`  Email: ${ws.email}`)
    console.log(`  Email notifications: ${ws.emailNotifyRequests}`)
    console.log(`  Location: ${ws.latitude}, ${ws.longitude}`)
    console.log(`  Service active: ${ws.workshopServices[0]?.isActive}`)
    console.log()
  })
  
  console.log('\n=== CHECKING WORKSHOP BROWSE VIEW QUERY ===\n')
  
  // Simulate the query from browse-requests page
  if (workshops.length > 0) {
    const workshop = workshops[0]
    
    // Check distance for each request
    for (const req of requests) {
      const distance = Math.sqrt(
        Math.pow(workshop.latitude - req.latitude, 2) + 
        Math.pow(workshop.longitude - req.longitude, 2)
      ) * 111 // rough km conversion
      
      console.log(`Distance from "${workshop.companyName}" to Request ${req.id}: ${distance.toFixed(2)} km`)
    }
  }
  
  console.log('\n=== SIMULATING BROWSE-REQUESTS API QUERY ===\n')
  
  if (workshops.length > 0) {
    const workshop = workshops[0]
    const maxDistance = workshop.maxDistance || 50
    
    // Get workshop service types
    const activeServices = await prisma.workshopService.findMany({
      where: {
        workshopId: workshop.id,
        isActive: true
      },
      select: {
        serviceType: true
      }
    })
    
    console.log(`Workshop "${workshop.companyName}" active services:`)
    activeServices.forEach(s => console.log(`  - ${s.serviceType}`))
    console.log()
    
    // Try to fetch tire requests as the API would
    const tireRequests = await prisma.tireRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'OPEN', 'QUOTED']
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        offers: {
          where: {
            workshopId: workshop.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Total requests with PENDING/OPEN/QUOTED status: ${tireRequests.length}`)
    
    // Filter motorcycle requests
    const motorcycleRequests = tireRequests.filter(req => 
      req.additionalNotes?.includes('Motorradreifen') || 
      req.additionalNotes?.includes('✓ Vorderreifen:')
    )
    
    console.log(`Motorcycle requests found: ${motorcycleRequests.length}`)
    
    motorcycleRequests.forEach(req => {
      const distance = Math.sqrt(
        Math.pow(workshop.latitude - req.latitude, 2) + 
        Math.pow(workshop.longitude - req.longitude, 2)
      ) * 111
      
      const withinDistance = distance <= maxDistance
      const hasOffer = req.offers.length > 0
      
      console.log(`\nRequest ${req.id}:`)
      console.log(`  Status: ${req.status}`)
      console.log(`  Distance: ${distance.toFixed(2)} km (max: ${maxDistance} km)`)
      console.log(`  Within range: ${withinDistance}`)
      console.log(`  Has offer from this workshop: ${hasOffer}`)
      console.log(`  Should be visible: ${withinDistance && ['PENDING', 'OPEN'].includes(req.status)}`)
    })
  }
  
  await prisma.$disconnect()
}

debugMotorcycle().catch(console.error)
