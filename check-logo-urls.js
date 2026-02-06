const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLogoUrls() {
  const workshops = await prisma.workshop.findMany({
    where: { logoUrl: { not: null } },
    select: { id: true, companyName: true, logoUrl: true },
    take: 5
  })
  
  console.log('Workshop Logo URLs:')
  workshops.forEach(w => {
    console.log(`${w.companyName}: ${w.logoUrl}`)
  })
  
  await prisma.$disconnect()
}

checkLogoUrls().catch(console.error)
