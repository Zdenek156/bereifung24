// Adds FIREBASE_ANALYTICS_PROPERTY_ID to admin_api_settings table
// Run on server: node add-firebase-analytics-setting.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.adminApiSetting.upsert({
    where: { key: 'FIREBASE_ANALYTICS_PROPERTY_ID' },
    update: {},
    create: {
      key: 'FIREBASE_ANALYTICS_PROPERTY_ID',
      value: '',
      description: 'Firebase/Google Analytics 4 Property-ID für App-Statistiken (aus Firebase Console → Projekteinstellungen → Integrationen → Google Analytics, z.B. 123456789)',
    },
  })
  console.log('✅ FIREBASE_ANALYTICS_PROPERTY_ID angelegt:', result.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
