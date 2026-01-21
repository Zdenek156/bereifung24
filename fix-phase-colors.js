const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixPhaseColors() {
  console.log('🔍 Checking all phases...')
  
  const allPhases = await prisma.roadmapPhase.findMany()
  
  console.log(`Found ${allPhases.length} phases total`)
  
  const phasesWithoutColor = allPhases.filter(p => !p.color || p.color === '')
  
  console.log(`Phases without color: ${phasesWithoutColor.length}`)
  phasesWithoutColor.forEach(phase => {
    console.log(`  - ${phase.name} (ID: ${phase.id}) - color: "${phase.color}"`)
  })
  
  if (phasesWithoutColor.length === 0) {
    console.log('✅ All phases have colors!')
    allPhases.forEach(p => console.log(`  ✓ ${p.name}: ${p.color}`))
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
