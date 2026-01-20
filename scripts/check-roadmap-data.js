const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTasks() {
  const count = await prisma.roadmapTask.count()
  console.log('📊 Tasks in DB:', count)
  
  const phases = await prisma.roadmapPhase.count()
  console.log('📋 Phases in DB:', phases)
  
  await prisma.$disconnect()
}

checkTasks()
