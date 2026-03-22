// Script to add GOOGLE_SEARCH_CONSOLE_KEY to AdminApiSetting table
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Adding GOOGLE_SEARCH_CONSOLE_KEY to AdminApiSetting...')
    
    const setting = await prisma.adminApiSetting.upsert({
      where: { key: 'GOOGLE_SEARCH_CONSOLE_KEY' },
      update: {
        description: 'Google Search Console Service Account JSON Key (kompletter JSON-Inhalt des heruntergeladenen Schlüssels)'
      },
      create: {
        key: 'GOOGLE_SEARCH_CONSOLE_KEY',
        value: '',
        description: 'Google Search Console Service Account JSON Key (kompletter JSON-Inhalt des heruntergeladenen Schlüssels)'
      }
    })
    
    console.log('✓ GOOGLE_SEARCH_CONSOLE_KEY successfully added:', setting)
    console.log('\nYou can now configure it at: /admin/api-settings or /mitarbeiter/api-settings')
    console.log('\nSteps:')
    console.log('1. Go to Google Cloud Console > IAM & Admin > Service Accounts')
    console.log('2. Create a Service Account')
    console.log('3. Create a JSON key for it')
    console.log('4. Paste the entire JSON content into the API settings field')
    console.log('5. Add the service account email as Reader in Google Search Console')
  } catch (error) {
    console.error('Error adding GOOGLE_SEARCH_CONSOLE_KEY:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
