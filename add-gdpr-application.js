/**
 * Add GDPR Export Application to Database
 * Run with: node add-gdpr-application.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Check if GDPR application already exists
    const existing = await prisma.application.findUnique({
      where: { key: 'gdpr' }
    })

    if (existing) {
      console.log('✅ GDPR application already exists in database')
      console.log(existing)
      return
    }

    // Create GDPR application
    const gdprApp = await prisma.application.create({
      data: {
        key: 'gdpr',
        name: 'DSGVO Datenexport',
        description: 'Export aller personenbezogenen Daten gemäß Art. 15 DSGVO',
        icon: 'Shield',
        adminRoute: '/admin/gdpr',
        color: 'blue',
        category: 'DATENSCHUTZ',
        sortOrder: 110,
        isActive: true
      }
    })

    console.log('✅ GDPR application created successfully:')
    console.log(gdprApp)
  } catch (error) {
    console.error('❌ Error creating GDPR application:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
