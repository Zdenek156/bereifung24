const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const stats = await prisma.$queryRawUnsafe(`
      SELECT construction, COUNT(*) as count 
      FROM tire_catalog 
      WHERE vehicle_type = 'MOTO' 
      GROUP BY construction 
      ORDER BY count DESC
    `)
    console.log('MOTO construction distribution:', stats)
  } finally {
    await prisma.$disconnect()
  }
}

main()
