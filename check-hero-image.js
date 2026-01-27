const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkHeroImage() {
  try {
    // Find landing page for "test" slug
    const landingPage = await prisma.workshopLandingPage.findUnique({
      where: { slug: 'test' },
      include: {
        workshop: {
          include: {
            user: true
          }
        }
      }
    })

    if (!landingPage) {
      console.log('❌ Landing page not found for slug "test"')
      return
    }

    console.log('\n📄 Landing Page Data:')
    console.log('ID:', landingPage.id)
    console.log('Slug:', landingPage.slug)
    console.log('Active:', landingPage.isActive)
    console.log('Hero Image:', landingPage.heroImage || '(not set)')
    console.log('Hero Headline:', landingPage.heroHeadline || '(not set)')
    console.log('Hero Subline:', landingPage.heroSubline || '(not set)')
    console.log('Show Logo:', landingPage.showLogo)
    console.log('\n🏢 Workshop Data:')
    console.log('Company Name:', landingPage.workshop.companyName)
    console.log('Logo URL:', landingPage.workshop.logoUrl || '(not set)')

    console.log('\n✅ Data check complete!')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkHeroImage()
