// Check which vehicles have mixed tires configured
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMixedTires() {
  try {
    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
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
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })

    console.log(`\n📊 Found ${vehicles.length} vehicles\n`)

    for (const vehicle of vehicles) {
      console.log(`🚗 ${vehicle.make} ${vehicle.model} (${vehicle.year})`)
      console.log(`   Owner: ${vehicle.customer.user.email}`)
      console.log(`   ID: ${vehicle.id}`)

      // Check each tire type
      const tireTypes = [
        { name: 'Summer', data: vehicle.summerTires },
        { name: 'Winter', data: vehicle.winterTires },
        { name: 'All-Season', data: vehicle.allSeasonTires }
      ]

      for (const { name, data } of tireTypes) {
        if (!data) continue

        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data

          if (parsed.hasDifferentSizes) {
            console.log(`   ✅ ${name} Tires: MIXED CONFIGURATION`)
            console.log(`      Front: ${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`)
            console.log(`      Rear:  ${parsed.rearWidth}/${parsed.rearAspectRatio} R${parsed.rearDiameter}`)
          } else {
            console.log(`   ⚪ ${name} Tires: ${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}`)
          }
        } catch (e) {
          console.log(`   ❌ ${name} Tires: Parse error`)
        }
      }

      console.log('')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMixedTires()
