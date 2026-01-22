const { PrismaClient } = require('@prisma/client')

async function rollback() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Rolling back failed migration...\n')
    
    // Drop the new enum that was created
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "RoadmapTaskPriority"')
    console.log('✅ Dropped new enum')
    
    // Rename old enum back
    await prisma.$executeRawUnsafe('ALTER TYPE "RoadmapTaskPriority_old" RENAME TO "RoadmapTaskPriority"')
    console.log('✅ Restored old enum')
    
    console.log('\n✅ Rollback completed successfully!')
    
  } catch (error) {
    console.error('\n💥 Rollback failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

rollback()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
