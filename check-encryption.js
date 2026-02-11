const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Delete all workshop suppliers
    const deleted = await prisma.workshopSupplier.deleteMany({})
    console.log(`✅ Deleted ${deleted.count} supplier entries`)
    
    // Check if ENCRYPTION_KEY is set
    const hasKey = !!process.env.ENCRYPTION_KEY
    console.log(`ENCRYPTION_KEY is set: ${hasKey}`)
    
    if (hasKey) {
      console.log(`ENCRYPTION_KEY length: ${process.env.ENCRYPTION_KEY.length} characters`)
    } else {
      console.log('⚠️  WARNING: ENCRYPTION_KEY is NOT set in environment!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
