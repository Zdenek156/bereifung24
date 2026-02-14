const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSkodaIndices() {
  try {
    console.log('🔍 Searching for Skoda Octavia vehicles...\n')
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { make: { contains: 'Skoda', mode: 'insensitive' } },
          { model: { contains: 'Octavia', mode: 'insensitive' } }
        ]
      },
      include: {
        customer: {
          select: {
            userId: true,
            user: {
              select: { email: true }
            }
          }
        }
      },
      take: 5
    })
    
    console.log(`Found ${vehicles.length} Skoda/Octavia vehicles\n`)
    
    for (const vehicle of vehicles) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`Vehicle ID: ${vehicle.id}`)
      console.log(`Owner: ${vehicle.customer?.user?.email || 'Unknown'}`)
      console.log(`Make: ${vehicle.make}, Model: ${vehicle.model}`)
      console.log(`Year: ${vehicle.year || 'Not set'}`)
      
      // Parse Summer Tires
      let summerData = null
      if (vehicle.summerTires) {
        try {
          summerData = typeof vehicle.summerTires === 'string' 
            ? JSON.parse(vehicle.summerTires) 
            : vehicle.summerTires
          
          console.log(`\n📅 SUMMER TIRES:`)
          console.log(`  Dimensions: ${summerData.width}/${summerData.aspectRatio} R${summerData.diameter}`)
          console.log(`  🔒 Load Index: ${summerData.loadIndex || '❌ MISSING'}`)
          console.log(`  🔒 Speed Index: ${summerData.speedIndex || summerData.speedRating || '❌ MISSING'}`)
          
          if (!summerData.loadIndex || !summerData.speedIndex) {
            console.log(`  ⚠️  WARNING: Missing safety indices!`)
          }
        } catch (e) {
          console.log(`  ❌ Error parsing summer tires:`, e.message)
        }
      } else {
        console.log(`\n📅 SUMMER TIRES: ❌ Not set`)
      }
      
      // Parse Winter Tires
      let winterData = null
      if (vehicle.winterTires) {
        try {
          winterData = typeof vehicle.winterTires === 'string' 
            ? JSON.parse(vehicle.winterTires) 
            : vehicle.winterTires
          
          console.log(`\n❄️  WINTER TIRES:`)
          console.log(`  Dimensions: ${winterData.width}/${winterData.aspectRatio} R${winterData.diameter}`)
          console.log(`  🔒 Load Index: ${winterData.loadIndex || '❌ MISSING'}`)
          console.log(`  🔒 Speed Index: ${winterData.speedIndex || winterData.speedRating || '❌ MISSING'}`)
          
          if (!winterData.loadIndex || !winterData.speedIndex) {
            console.log(`  ⚠️  WARNING: Missing safety indices!`)
          }
        } catch (e) {
          console.log(`  ❌ Error parsing winter tires:`, e.message)
        }
      } else {
        console.log(`\n❄️  WINTER TIRES: ❌ Not set`)
      }
      
      console.log(`${'='.repeat(80)}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSkodaIndices()
