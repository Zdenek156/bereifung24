const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Simuliere den Request vom Frontend
const testProfile = {
  // Stufe 1: Fahrzeug
  width: 205,
  aspectRatio: 55,
  diameter: 16,
  vehicleType: 'medium',
  kmPerYear: 15000,
  
  // Stufe 2: Nutzung
  usageCity: 40,
  usageLandroad: 30,
  usageHighway: 30,
  drivingStyle: 'normal',
  
  // Stufe 3: Prioritäten - Check if sum = 100
  prioritySafety: 30,
  priorityFuelSaving: 20,
  priorityQuietness: 15,
  priorityDurability: 35,
  // priorityValue: 0, // Should NOT be sent anymore
  
  // Stufe 4: Saison
  season: 'winter',
  needs3PMSF: true,
}

console.log('Testing Smart Advisor profile...')
console.log('Profile:', JSON.stringify(testProfile, null, 2))

// Check priority sum
const prioritySum = testProfile.prioritySafety + 
                   testProfile.priorityFuelSaving + 
                   testProfile.priorityQuietness + 
                   testProfile.priorityDurability

console.log('\n=== VALIDATION ===')
console.log('Priority Sum:', prioritySum)
console.log('Valid?', Math.abs(prioritySum - 100) <= 1)

// Check if profile has priorityValue
console.log('Has priorityValue?', 'priorityValue' in testProfile)

async function testQuery() {
  console.log('\n=== DATABASE QUERY ===')
  const count = await prisma.ePRELTire.count({
    where: {
      width: testProfile.width,
      aspectRatio: testProfile.aspectRatio,
      diameter: testProfile.diameter,
      ...(testProfile.season === 'winter' ? { has3PMSF: true } : {}),
    }
  })
  
  console.log(`Found ${count} matching tires`)
  
  if (count > 0) {
    const sample = await prisma.ePRELTire.findFirst({
      where: {
        width: testProfile.width,
        aspectRatio: testProfile.aspectRatio,
        diameter: testProfile.diameter,
        ...(testProfile.season === 'winter' ? { has3PMSF: true } : {}),
      },
      select: {
        supplierName: true,
        modelName: true,
        tyreDimension: true,
        has3PMSF: true,
      }
    })
    console.log('Sample tire:', sample)
  }
}

testQuery()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
