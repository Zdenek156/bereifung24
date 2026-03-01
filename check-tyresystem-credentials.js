const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCredentials() {
  console.log('🔍 Checking TyreSystem credentials...\n')
  
  const suppliers = await prisma.workshopSupplier.findMany({
    where: {
      supplier: 'TYRESYSTEM'
    },
    include: {
      workshop: {
        select: {
          companyName: true
        }
      }
    }
  })
  
  console.log(`Found ${suppliers.length} TyreSystem suppliers\n`)
  
  suppliers.forEach(s => {
    console.log(`Workshop: ${s.workshop.companyName}`)
    console.log(`  Supplier: ${s.supplier}`)
    console.log(`  Name: ${s.name}`)
    console.log(`  Connection: ${s.connectionType}`)
    console.log(`  Active: ${s.isActive}`)
    console.log(`  Has Username: ${!!s.usernameEncrypted}`)
    console.log(`  Has Password: ${!!s.passwordEncrypted}`)
    console.log(`  Last API Check: ${s.lastApiCheck || 'Never'}`)
    console.log(`  Last Error: ${s.lastApiError || 'None'}`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

checkCredentials().catch(err => {
  console.error('ERROR:', err.message)
  process.exit(1)
})
