const { PrismaClient } = require('@prisma/client')

/**
 * Fix invalid task priorities
 * Maps old priority formats (P0_CRITICAL, P1_HIGH, etc.) to new format (P0, P1, P2, P3)
 */

async function fixTaskPriorities() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking for tasks with invalid priorities...\n')
    
    // Valid priorities
    const validPriorities = ['P0', 'P1', 'P2', 'P3']
    
    // Priority mapping
    const priorityMap = {
      'P0_CRITICAL': 'P0',
      'P0_critical': 'P0',
      'critical': 'P0',
      'CRITICAL': 'P0',
      
      'P1_HIGH': 'P1',
      'P1_high': 'P1',
      'high': 'P1',
      'HIGH': 'P1',
      
      'P1_MEDIUM': 'P1',
      'P1_medium': 'P1',
      'P2_MEDIUM': 'P2',
      'P2_medium': 'P2',
      'medium': 'P2',
      'MEDIUM': 'P2',
      
      'P2_LOW': 'P2',
      'P2_low': 'P2',
      'P3_LOW': 'P3',
      'P3_low': 'P3',
      'low': 'P3',
      'LOW': 'P3'
    }
    
    // Get all tasks
    const allTasks = await prisma.roadmapTask.findMany({
      select: {
        id: true,
        title: true,
        priority: true
      }
    })
    
    console.log(`📊 Total tasks: ${allTasks.length}`)
    
    // Find tasks with invalid priorities
    const invalidTasks = allTasks.filter(task => !validPriorities.includes(task.priority))
    
    console.log(`⚠️  Tasks with invalid priority: ${invalidTasks.length}\n`)
    
    if (invalidTasks.length === 0) {
      console.log('✅ All tasks already have valid priorities!')
      return
    }
    
    // Show what will be changed
    console.log('📋 Priority changes:\n')
    const changes = {}
    invalidTasks.forEach(task => {
      const newPriority = priorityMap[task.priority] || 'P2' // Default to P2 if unknown
      if (!changes[task.priority]) {
        changes[task.priority] = { old: task.priority, new: newPriority, count: 0 }
      }
      changes[task.priority].count++
    })
    
    Object.values(changes).forEach(change => {
      console.log(`  ${change.old} → ${change.new} (${change.count} tasks)`)
    })
    
    console.log('\n🔧 Fixing tasks...\n')
    
    let fixed = 0
    for (const task of invalidTasks) {
      const newPriority = priorityMap[task.priority] || 'P2'
      
      await prisma.roadmapTask.update({
        where: { id: task.id },
        data: { priority: newPriority }
      })
      
      fixed++
      console.log(`  ✅ Fixed: "${task.title}" (${task.priority} → ${newPriority})`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ SUCCESS! Fixed ${fixed} tasks`)
    console.log('='.repeat(60))
    
    // Verify
    const verify = await prisma.roadmapTask.findMany({
      select: { priority: true }
    })
    
    const stillInvalid = verify.filter(t => !validPriorities.includes(t.priority))
    
    if (stillInvalid.length === 0) {
      console.log('\n✨ All tasks now have valid priorities: P0, P1, P2, or P3')
    } else {
      console.log(`\n⚠️  WARNING: ${stillInvalid.length} tasks still have invalid priorities`)
    }
    
  } catch (error) {
    console.error('\n💥 Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixTaskPriorities()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
