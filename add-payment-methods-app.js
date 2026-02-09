const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addPaymentMethodsApp() {
  try {
    // Check if application already exists
    const existing = await prisma.application.findUnique({
      where: { key: 'payment-methods' }
    })

    if (existing) {
      console.log('✅ Application already exists:', existing.name)
      return
    }

    // Create Payment Methods application
    const app = await prisma.application.create({
      data: {
        key: 'payment-methods',
        name: 'Zahlungsmethoden',
        description: 'Übersicht aller verfügbaren Zahlungsmethoden für Kunden (Stripe, PayPal)',
        adminRoute: '/admin/payment-methods',
        icon: 'CreditCard',
        category: 'ADMIN',
        color: 'green',
        sortOrder: 180,
        isActive: true
      }
    })

    console.log('✅ Payment Methods application created successfully!')
    console.log('   ID:', app.id)
    console.log('   Key:', app.key)
    console.log('   Name:', app.name)
    console.log('   Route:', app.adminRoute)
    console.log('   Icon:', app.icon)

  } catch (error) {
    console.error('❌ Error creating Payment Methods application:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addPaymentMethodsApp()
