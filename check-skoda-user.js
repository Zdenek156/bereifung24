const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSkodaUser() {
  try {
    // Find user's Skoda vehicle
    const vehicles = await prisma.vehicle.findMany({
      where: {
        customer: {
          user: {
            email: 'mb2811@web.de'
          }
        },
        OR: [
          { make: { contains: 'Skoda', mode: 'insensitive' } },
          { make: { contains: 'Škoda', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        summerTires: true,
        winterTires: true,
        allSeasonTires: true,
        customer: {
          select: {
            userId: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })

    console.log('\n=== SKODA VEHICLES ===')
    console.log(`Found ${vehicles.length} Skoda vehicle(s)`)
    
    vehicles.forEach((v, idx) => {
      console.log(`\n--- Vehicle ${idx + 1} ---`)
      console.log(`ID: ${v.id}`)
      console.log(`Make/Model: ${v.make} ${v.model}`)
      console.log(`Year: ${v.year}`)
      console.log(`User Email: ${v.customer.user.email}`)
      
      // Parse tire data
      console.log('\nTire Data:')
      if (v.summerTires) {
        try {
          const summer = typeof v.summerTires === 'string' ? JSON.parse(v.summerTires) : v.summerTires
          console.log(`  Summer: ${summer.width}/${summer.aspectRatio} R${summer.diameter}`)
        } catch (e) {
          console.log(`  Summer: PARSE ERROR`)
        }
      } else {
        console.log(`  Summer: NULL`)
      }
      
      if (v.winterTires) {
        try {
          const winter = typeof v.winterTires === 'string' ? JSON.parse(v.winterTires) : v.winterTires
          console.log(`  Winter: ${winter.width}/${winter.aspectRatio} R${winter.diameter}`)
        } catch (e) {
          console.log(`  Winter: PARSE ERROR`)
        }
      } else {
        console.log(`  Winter: NULL`)
      }
      
      if (v.allSeasonTires) {
        try {
          const allSeason = typeof v.allSeasonTires === 'string' ? JSON.parse(v.allSeasonTires) : v.allSeasonTires
          console.log(`  All-Season: ${allSeason.width}/${allSeason.aspectRatio} R${allSeason.diameter}`)
        } catch (e) {
          console.log(`  All-Season: PARSE ERROR`)
        }
      } else {
        console.log(`  All-Season: NULL`)
      }
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSkodaUser()
