const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

async function runMigration() {
  const prisma = new PrismaClient()
  
  try {
    console.log('📋 Running priority enum migration...\n')
    
    const sql = fs.readFileSync('migrate-priorities.sql', 'utf8')
    
    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT')
    
    console.log(`Found ${statements.length} SQL statements\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 80) + '...\n')
      
      try {
        await prisma.$executeRawUnsafe(statement)
        console.log('✅ Success\n')
      } catch (error) {
        console.error(`❌ Error: ${error.message}\n`)
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
