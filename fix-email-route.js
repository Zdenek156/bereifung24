const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Renaming email application to newsletter...')
  
  // Update existing 'email' key to 'newsletter'
  const result = await prisma.application.updateMany({
    where: {
      key: 'email'
    },
    data: {
      key: 'newsletter',
      name: 'Newsletter',
      adminRoute: '/admin/newsletter'
    }
  })
  
  console.log(`✅ Updated ${result.count} application(s)`)
  
  // Verify
  const app = await prisma.application.findUnique({
    where: { key: 'newsletter' }
  })
  
  console.log('📧 Newsletter application:', app?.name, '→', app?.adminRoute)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
