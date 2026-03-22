const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  const r1 = await prisma.servicePackage.updateMany({ 
    where: { name: 'Mit Auswuchten' }, 
    data: { name: 'Auswuchten' } 
  })
  const r2 = await prisma.servicePackage.updateMany({ 
    where: { name: 'Mit Einlagerung' }, 
    data: { name: 'Einlagerung' } 
  })
  console.log('Updated Auswuchten:', r1.count, 'Einlagerung:', r2.count)
  await prisma.$disconnect()
}
fix()
