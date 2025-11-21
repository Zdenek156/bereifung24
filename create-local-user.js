const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createUser() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@bereifung24.de' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@bereifung24.de',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    }
  })
  
  console.log('User created:', user.email)
  await prisma.$disconnect()
}

createUser().catch(console.error)
