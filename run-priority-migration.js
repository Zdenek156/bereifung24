const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

async function runMigration() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📋 Running priority enum migration...\n')
    
    const statements = [
      'ALTER TYPE "RoadmapTaskPriority" RENAME TO "RoadmapTaskPriority_old"',
      
      "CREATE TYPE \"RoadmapTaskPriority\" AS ENUM ('P0', 'P1', 'P2', 'P3')",
      
      `ALTER TABLE "RoadmapTask" 
       ALTER COLUMN priority TYPE "RoadmapTaskPriority" 
       USING (
         CASE priority::text 
           WHEN 'P0_CRITICAL' THEN 'P0'::text
           WHEN 'P1_HIGH' THEN 'P1'::text
           WHEN 'P2_MEDIUM' THEN 'P2'::text
           WHEN 'P3_LOW' THEN 'P3'::text
           ELSE 'P2'::text
         END
       )::"RoadmapTaskPriority"`,
      
      'DROP TYPE "RoadmapTaskPriority_old"'
    ]
    
    console.log(`Executing ${statements.length} SQL statements\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`${i + 1}. ${statement.substring(0, 60)}...`)
      
      try {
        await prisma.$executeRawUnsafe(statement)
        console.log('   ✅ Success\n')
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`)
        throw error
      }
    }
    
    console.log('='.repeat(60))
    console.log('✅ Migration completed successfully!')
    console.log('='.repeat(60))
    
    // Verify
    const tasks = await prisma.roadmapTask.findMany({
      select: { priority: true }
    })
    
    const priorities = [...new Set(tasks.map(t => t.priority))]
    console.log('\n📊 Current priorities in database:', priorities)
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
