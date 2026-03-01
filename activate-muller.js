const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // First find Müller by name
  const muller = await prisma.workshop.findFirst({
    where: { companyName: { contains: 'Müller' } }
  })
  
  if (!muller) {
    console.log('❌ Workshop not found')
    await prisma.$disconnect()
    return
  }
  
  // Update using id
  const result = await prisma.workshop.update({
    where: { id: muller.id },
    data: { status: 'ACTIVE' }
  })
  
  console.log('✅ Müller Status updated to ACTIVE:', result.companyName, result.status)
  
  await prisma.$disconnect()
}

main()
