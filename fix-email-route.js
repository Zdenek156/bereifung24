const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing email application route...')
  
  const result = await prisma.application.updateMany({
    where: {
      key: 'email'
    },
    data: {
      adminRoute: '/admin/email'
    }
  })
  
  console.log(`✅ Updated ${result.count} application(s)`)
  
  // Verify
  const app = await prisma.application.findUnique({
    where: { key: 'email' }
  })
  
  console.log('📧 Email application route:', app?.adminRoute)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
