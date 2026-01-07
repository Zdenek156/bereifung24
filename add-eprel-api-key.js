// Script to add EPREL_API_KEY to AdminApiSetting table
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Adding EPREL_API_KEY to AdminApiSetting...')
    
    const setting = await prisma.adminApiSetting.upsert({
      where: { key: 'EPREL_API_KEY' },
      update: {
        description: 'EPREL API Key für EU Reifenlabel-Daten (European Product Database for Energy Labelling)'
      },
      create: {
        key: 'EPREL_API_KEY',
        value: '',
        description: 'EPREL API Key für EU Reifenlabel-Daten (European Product Database for Energy Labelling)'
      }
    })
    
    console.log('✓ EPREL_API_KEY successfully added:', setting)
    console.log('\nYou can now configure it at: /admin/api-settings')
  } catch (error) {
    console.error('Error adding EPREL_API_KEY:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
