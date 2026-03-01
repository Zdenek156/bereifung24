const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking Müller Reifenservice WorkshopSupplier configuration...\n')

    const muller = await prisma.workshop.findFirst({
      where: { 
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      },
      include: {
        suppliers: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!muller) {
      console.log('❌ Müller Reifenservice not found')
      return
    }

    console.log('📍 Workshop:', muller.companyName)
    console.log('📧 Email:', muller.user.email)
    console.log('🆔 Workshop ID:', muller.id)
    console.log(`\n📋 WorkshopSuppliers (${muller.suppliers.length} total):\n`)

    if (muller.suppliers.length === 0) {
      console.log('❌ No WorkshopSupplier configuration found!')
      console.log('\n💡 Müller needs a WorkshopSupplier record with:')
      console.log('   - supplier: TYRESYSTEM')
      console.log('   - connectionType: API')
      console.log('   - isActive: true')
      console.log('   - usernameEncrypted/passwordEncrypted: API credentials')
      return
    }

    muller.suppliers.forEach((supplier, idx) => {
      console.log(`${idx + 1}. ${supplier.supplier}`)
      console.log(`   - connectionType: ${supplier.connectionType}`)
      console.log(`   - isActive: ${supplier.isActive}`)
      console.log(`   - apiUrl: ${supplier.apiUrl || 'N/A'}`)
      console.log(`   - usernameEncrypted: ${supplier.usernameEncrypted ? '✅ SET' : '❌ MISSING'}`)
      console.log(`   - passwordEncrypted: ${supplier.passwordEncrypted ? '✅ SET' : '❌ MISSING'}`)
      console.log(`   - csvImportUrl: ${supplier.csvImportUrl || 'N/A'}`)
      console.log(`   - autoOrder: ${supplier.autoOrder}`)
      console.log(`   - requiresManualOrder: ${supplier.requiresManualOrder}`)
      console.log(`   - priority: ${supplier.priority}`)
      console.log('')
    })

    // Check TireCatalog
    console.log('\n🗂️ Checking TireCatalog...')
    const catalogCount = await prisma.tireCatalog.count({
      where: {
        supplier: 'TYRESYSTEM',
        isActive: true
      }
    })
    console.log(`   - Total TYRESYSTEM tires: ${catalogCount}`)

    // Check a specific dimension
    const dimension = '225/45 R17'
    const match = dimension.match(/^(\d+)\/(\d+)\s*R(\d+)$/)
    if (match) {
      const width = parseInt(match[1])
      const height = parseInt(match[2])
      const diameter = parseInt(match[3])

      const matchingTires = await prisma.tireCatalog.count({
        where: {
          supplier: 'TYRESYSTEM',
          isActive: true,
          width,
          height,
          diameter
        }
      })
      console.log(`   - Matching ${dimension}: ${matchingTires} tires`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
