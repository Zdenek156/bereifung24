const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Delete all workshop suppliers (they have old encryption)
    const deleted = await prisma.workshopSupplier.deleteMany({})
    
    console.log(`✅ Deleted ${deleted.count} old supplier entries`)
    console.log('Please re-enter supplier credentials in the UI')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
