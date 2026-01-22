const { PrismaClient } = require('@prisma/client')

async function fixTaskPhases() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking for tasks with invalid phase data...')

    // 1. Get all phases
    const phases = await prisma.roadmapPhase.findMany({
      orderBy: { createdAt: 'asc' }
    })

    if (phases.length === 0) {
      console.log('❌ No phases found! Creating default phases...')
      
      // Create default phases
      const defaultPhases = [
        {
          name: 'Phase 1: Pre-Gründung',
          color: '#3B82F6', // blue
          startMonth: '2026-01',
          endMonth: '2026-01',
          description: 'Planung und Vorbereitung',
          order: 1
        },
        {
          name: 'Phase 2: Gründung & MVP',
          color: '#10B981', // green
          startMonth: '2026-02',
          endMonth: '2026-03',
          description: 'Unternehmensgründung und MVP-Entwicklung',
          order: 2
        },
        {
          name: 'Phase 3: Launch',
          color: '#F59E0B', // orange
          startMonth: '2026-04',
          endMonth: '2026-06',
          description: 'Markteinführung',
          order: 3
        },
        {
          name: 'Phase 4: Wachstum',
          color: '#8B5CF6', // purple
          startMonth: '2026-07',
          endMonth: '2026-12',
          description: 'Skalierung und Expansion',
          order: 4
        }
      ]

      for (const phaseData of defaultPhases) {
        const phase = await prisma.roadmapPhase.create({
          data: phaseData
        })
        console.log(`✅ Created phase: ${phase.name}`)
        phases.push(phase)
      }
    }

    console.log(`\n📋 Found ${phases.length} phases:`)
    phases.forEach(p => console.log(`  - ${p.name} (${p.color})`))

    // Use first phase as default
    const defaultPhase = phases[0]
    console.log(`\n🎯 Using "${defaultPhase.name}" as default phase\n`)

    // 2. Find all tasks
    const allTasks = await prisma.roadmapTask.findMany({
      include: {
        phase: true
      }
    })

    console.log(`📊 Total tasks: ${allTasks.length}`)

    // 3. Find tasks with problems
    const tasksWithoutPhase = allTasks.filter(t => !t.phaseId)
    const tasksWithInvalidPhase = allTasks.filter(t => 
      t.phaseId && (!t.phase || !t.phase.color || !t.phase.name)
    )

    console.log(`❌ Tasks without phase: ${tasksWithoutPhase.length}`)
    console.log(`⚠️  Tasks with invalid phase: ${tasksWithInvalidPhase.length}`)

    // 4. Fix tasks without phase
    if (tasksWithoutPhase.length > 0) {
      console.log('\n🔧 Fixing tasks without phase...')
      for (const task of tasksWithoutPhase) {
        await prisma.roadmapTask.update({
          where: { id: task.id },
          data: { 
            phaseId: defaultPhase.id,
            month: task.month || defaultPhase.startMonth
          }
        })
        console.log(`  ✅ Fixed: ${task.title}`)
      }
    }

    // 5. Fix tasks with invalid phase (orphaned phase references)
    if (tasksWithInvalidPhase.length > 0) {
      console.log('\n🔧 Fixing tasks with invalid phase...')
      for (const task of tasksWithInvalidPhase) {
        await prisma.roadmapTask.update({
          where: { id: task.id },
          data: { 
            phaseId: defaultPhase.id,
            month: task.month || defaultPhase.startMonth
          }
        })
        console.log(`  ✅ Fixed: ${task.title}`)
      }
    }

    // 6. Verify all tasks now have valid phases
    const verifyTasks = await prisma.roadmapTask.findMany({
      include: {
        phase: true
      }
    })

    const stillInvalid = verifyTasks.filter(t => 
      !t.phase || !t.phase.color || !t.phase.name
    )

    console.log('\n' + '='.repeat(60))
    if (stillInvalid.length === 0) {
      console.log('✅ SUCCESS! All tasks now have valid phase data!')
      console.log(`📊 Total tasks: ${verifyTasks.length}`)
      console.log(`✅ Valid tasks: ${verifyTasks.length}`)
    } else {
      console.log(`⚠️  WARNING: ${stillInvalid.length} tasks still have issues:`)
      stillInvalid.forEach(t => {
        console.log(`  - ${t.title} (ID: ${t.id})`)
        console.log(`    Phase ID: ${t.phaseId}`)
        console.log(`    Phase: ${JSON.stringify(t.phase)}`)
      })
    }
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error fixing tasks:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixTaskPhases()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
