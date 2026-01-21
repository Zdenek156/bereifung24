const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTasks() {
  try {
    console.log('Fetching all roadmap tasks...')
    const tasks = await prisma.roadmapTask.findMany({
      include: { 
        phase: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })
    
    console.log(`\nTotal tasks: ${tasks.length}`)
    
    const badTasks = tasks.filter(t => !t.phase || !t.phase.color)
    console.log(`Tasks without valid phase: ${badTasks.length}`)
    
    if (badTasks.length > 0) {
      console.log('\n❌ PROBLEMATIC TASKS:')
      badTasks.forEach(t => {
        console.log(`  - Task ID: ${t.id}`)
        console.log(`    Title: ${t.title}`)
        console.log(`    PhaseId: ${t.phaseId}`)
        console.log(`    Phase: ${JSON.stringify(t.phase)}`)
        console.log('')
      })
      
      console.log('\n🔧 Fix: Delete these orphaned tasks')
      console.log(`DELETE FROM "RoadmapTask" WHERE id IN ('${badTasks.map(t => t.id).join("', '")}');`)
    } else {
      console.log('\n✅ All tasks have valid phase data!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTasks()
