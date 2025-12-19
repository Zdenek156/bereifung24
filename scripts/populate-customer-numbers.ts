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

  for (const workshop of workshops) {
    const createdAt = new Date(workshop.createdAt)
    const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '')
    
    // Get count of workshops created on the same day
    const dayStart = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    
    const workshopsOnDay = await prisma.workshop.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    })
    
    const counter = workshopsOnDay.toString().padStart(3, '0')
    const customerNumber = `KD-${dateStr}-${counter}`
    
    console.log(`Updating workshop ${workshop.id} (${workshop.companyName}): ${customerNumber}`)
    
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { customerNumber }
    })
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
