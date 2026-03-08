const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    // Check vehicle types
    const types = await prisma.$queryRawUnsafe(`
      SELECT vehicle_type, COUNT(*) as count 
      FROM tire_catalog 
      GROUP BY vehicle_type 
      ORDER BY count DESC
    `)
    console.log('Vehicle type distribution:')
    console.log(types)

    // Check construction distribution (all types)
    const construction = await prisma.$queryRawUnsafe(`
      SELECT construction, COUNT(*) as count 
      FROM tire_catalog 
      WHERE construction IS NOT NULL
      GROUP BY construction 
      ORDER BY count DESC
    `)
    console.log('\nConstruction distribution (all):')
    console.log(construction)
    
    // Count non-null construction
    const withC = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM tire_catalog WHERE construction IS NOT NULL
    `)
    console.log('\nTotal with construction:', withC)
  } finally {
    await prisma.$disconnect()
  }
}

main()
