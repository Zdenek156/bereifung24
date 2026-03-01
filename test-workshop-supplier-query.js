const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testWorkshopSupplierQuery() {
  try {
    console.log('🔍 Testing WorkshopSupplier query for Müller...\n')

    // Müller's ID from previous check
    const mullerId = 'cmi9c1qzn000110hd0838ppwx'

    console.log('📝 Test 1: Direct WorkshopSupplier.findFirst()')
    const supplier = await prisma.workshopSupplier.findFirst({
      where: {
        workshopId: mullerId,
        isActive: true
      },
      orderBy: {
        priority: 'asc'
      }
    })

    if (supplier) {
      console.log('✅ FOUND via workshopSupplier.findFirst():')
      console.log('   - Supplier:', supplier.supplier)
      console.log('   - Connection Type:', supplier.connectionType)
      console.log('   - Is Active:', supplier.isActive)
      console.log('   - Priority:', supplier.priority)
    } else {
      console.log('❌ NOT FOUND via workshopSupplier.findFirst()')
    }

    console.log('\n📝 Test 2: WorkshopSupplier.findMany() for Müller')
    const suppliers = await prisma.workshopSupplier.findMany({
      where: {
        workshopId: mullerId
      }
    })
    console.log(`   Found ${suppliers.length} suppliers`)
    suppliers.forEach(s => {
      console.log(`   - ${s.supplier}: connectionType=${s.connectionType}, isActive=${s.isActive}`)
    })

    console.log('\n📝 Test 3: Check if model name is correct')
    console.log('   Available Prisma models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('   Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWorkshopSupplierQuery()
