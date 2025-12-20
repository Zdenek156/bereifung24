const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@bereifung24.de' }
    })

    if (existing) {
      console.log('✅ Test user already exists')
      console.log('Email: test@bereifung24.de')
      console.log('Password: Test1234')
      return
    }

    const hashedPassword = await bcrypt.hash('Test1234', 10)

    const user = await prisma.user.create({
      data: {
        email: 'test@bereifung24.de',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '+49123456789',
        street: 'Teststraße 1',
        zipCode: '10115',
        city: 'Berlin',
        role: 'CUSTOMER',
        emailVerified: new Date(),
        customer: {
          create: {}
        }
      }
    })

    console.log('✅ Test user created successfully')
    console.log('Email: test@bereifung24.de')
    console.log('Password: Test1234')
    console.log('User ID:', user.id)

  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
