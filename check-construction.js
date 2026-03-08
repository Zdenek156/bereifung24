const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    // Count construction values for motorcycle tires
    const stats = await prisma.$queryRawUnsafe(`
      SELECT construction, COUNT(*) as count 
      FROM tire_catalog 
      WHERE vehicle_type = 'MOTORCYCLE' 
      GROUP BY construction 
      ORDER BY count DESC
    `)
    console.log('Motorcycle tire construction distribution:')
    console.log(stats)
    
    // Total motorcycle tires with construction
    const withConstruction = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM tire_catalog 
      WHERE vehicle_type = 'MOTORCYCLE' AND construction IS NOT NULL
    `)
    console.log('\nMotorcycle tires with construction:', withConstruction)
    
    // Total motorcycle tires
    const totalMotorcycle = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM tire_catalog 
      WHERE vehicle_type = 'MOTORCYCLE'
    `)
    console.log('Total motorcycle tires:', totalMotorcycle)
  } finally {
    await prisma.$disconnect()
  }
}

main()
