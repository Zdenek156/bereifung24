const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixPhaseColors() {
  console.log('🔍 Checking for phases without color...')
  
  const phasesWithoutColor = await prisma.roadmapPhase.findMany({
    where: {
      OR: [
        { color: null },
        { color: '' }
      ]
    }
  })
  
  console.log(`Found ${phasesWithoutColor.length} phases without color:`)
  phasesWithoutColor.forEach(phase => {
    console.log(`  - ${phase.name} (ID: ${phase.id})`)
  })
  
  if (phasesWithoutColor.length === 0) {
    console.log('✅ All phases have colors!')
    return
  }
  
  // Default colors for phases
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
  console.log('\n🔧 Fixing phases...')
  for (let i = 0; i < phasesWithoutColor.length; i++) {
    const phase = phasesWithoutColor[i]
    const color = defaultColors[i % defaultColors.length]
    
    await prisma.roadmapPhase.update({
      where: { id: phase.id },
      data: { color }
    })
    
    console.log(`  ✓ Updated ${phase.name} with color ${color}`)
  }
  
  console.log('\n✅ All phases now have colors!')
}

fixPhaseColors()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
