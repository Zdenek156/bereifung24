const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugLandingPage() {
  const lp = await prisma.workshopLandingPage.findUnique({ 
    where: { slug: 'test' },
    include: {
      workshop: {
        include: {
          user: true
        }
      }
    }
  })
  
  console.log('\n=== LANDING PAGE DEBUG ===')
  console.log('Slug:', lp.slug)
  console.log('Active:', lp.isActive)
  console.log('Hero Image Path:', lp.heroImage)
  console.log('Hero Headline:', lp.heroHeadline)
  console.log('Show Logo:', lp.showLogo)
  console.log('Workshop Logo:', lp.workshop.logoUrl)
  console.log('\nFull URL for Hero Image:')
  console.log('https://bereifung24.de' + lp.heroImage)
  console.log('\n======================\n')
  
  await prisma.$disconnect()
}

debugLandingPage().catch(console.error)
