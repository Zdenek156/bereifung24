// Script to initialize API settings in database
// Run this once after deploying the new API settings feature

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function initializeApiSettings() {
  console.log('🔧 Initializing API Settings...')

  const settings = [
    {
      key: 'GOCARDLESS_ACCESS_TOKEN',
      value: process.env.GOCARDLESS_ACCESS_TOKEN || '',
      description: 'GoCardless API Access Token für SEPA-Lastschriften'
    },
    {
      key: 'GOCARDLESS_ENVIRONMENT',
      value: process.env.GOCARDLESS_ENVIRONMENT || 'sandbox',
      description: 'GoCardless Umgebung (sandbox oder live)'
    },
    {
      key: 'GOOGLE_OAUTH_CLIENT_ID',
      value: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      description: 'Google OAuth Client ID für Calendar Integration'
    },
    {
      key: 'GOOGLE_OAUTH_CLIENT_SECRET',
      value: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      description: 'Google OAuth Client Secret'
    }
  ]

  for (const setting of settings) {
    const existing = await prisma.adminApiSetting.findUnique({
      where: { key: setting.key }
    })

    if (existing) {
      console.log(`   ✓ ${setting.key} already exists`)
    } else {
      await prisma.adminApiSetting.create({
        data: setting
      })
      console.log(`   + Created ${setting.key}`)
    }
  }

  console.log('\n✅ API Settings initialized!')
  console.log('\n⚠️  WICHTIG: Du kannst jetzt die Keys im Admin-Bereich verwalten:')
  console.log('   https://bereifung24.de/admin/api-settings')
  console.log('\n⚠️  Die Keys aus .env wurden in die Datenbank kopiert.')
  console.log('   Du kannst sie jetzt aus .env entfernen (außer als Fallback).')
}

initializeApiSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
