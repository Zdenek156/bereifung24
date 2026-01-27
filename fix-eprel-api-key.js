// Script to fix the EPREL API key (typo correction from DG ENER team)
// Correct key: cllIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP (note: two lowercase "l" at the beginning)

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixEprelApiKey() {
  try {
    console.log('Updating EPREL_API_KEY with corrected value (typo fix from DG ENER)...')
    
    const correctKey = 'cllIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP'
    
    const setting = await prisma.adminApiSetting.upsert({
      where: { key: 'EPREL_API_KEY' },
      update: {
        value: correctKey,
        description: 'EPREL API Key für EU Reifenlabel-Daten (Corrected: 2 lowercase "l" not "lI")'
      },
      create: {
        key: 'EPREL_API_KEY',
        value: correctKey,
        description: 'EPREL API Key für EU Reifenlabel-Daten (Corrected: 2 lowercase "l" not "lI")'
      }
    })

    console.log('✓ EPREL_API_KEY successfully updated:', {
      key: setting.key,
      valuePreview: setting.value.substring(0, 10) + '...',
      description: setting.description
    })

    console.log('\n📧 Response from DG ENER Product Energy Efficiency Team:')
    console.log('   "There is a typo in the key: 2 \'l\' are needed."')
    console.log('   Corrected: clIkTy → cllIkTy')
    console.log('\n✅ Ready to test with curl:')
    console.log(`   curl -L --output tyres.zip -H "X-Api-Key: ${correctKey}" https://eprel.ec.europa.eu/api/exportProducts/tyres`)
  } catch (error) {
    console.error('Error updating EPREL_API_KEY:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixEprelApiKey()
