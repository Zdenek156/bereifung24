const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRelationTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (tablename LIKE '%BlogPost%' OR tablename LIKE '_blog%')
      ORDER BY tablename
    `
    console.log('Relation tables:', JSON.stringify(tables, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRelationTables()
