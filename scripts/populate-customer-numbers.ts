import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Populating customer numbers for existing workshops...')
  
  // Get all workshops without customer numbers
  const workshops = await prisma.workshop.findMany({
    where: {
      customerNumber: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`Found ${workshops.length} workshops without customer numbers`)

  let counter = 1
  
  for (const workshop of workshops) {
    const createdAt = new Date(workshop.createdAt)
    const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '')
    
    const customerNumber = `KD-${dateStr}-${counter.toString().padStart(3, '0')}`
    
    console.log(`Updating workshop ${workshop.id} (${workshop.companyName}): ${customerNumber}`)
    
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { customerNumber }
    })
    
    counter++
  }

  console.log('✅ All workshops updated successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
