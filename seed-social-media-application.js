/**
 * Seed Script: Add Social Media Marketing Application
 * Run: node seed-social-media-application.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Social Media Marketing application...')

  const result = await prisma.application.upsert({
    where: { key: 'social-media' },
    update: {
      name: 'Social Media Marketing',
      description: 'Posts erstellen, planen und automatisiert auf Facebook, Instagram, LinkedIn & YouTube veröffentlichen',
      icon: 'Share2',
      adminRoute: '/admin/social-media',
      color: 'pink',
      category: 'SALES',
      sortOrder: 70
    },
    create: {
      key: 'social-media',
      name: 'Social Media Marketing',
      description: 'Posts erstellen, planen und automatisiert auf Facebook, Instagram, LinkedIn & YouTube veröffentlichen',
      icon: 'Share2',
      adminRoute: '/admin/social-media',
      color: 'pink',
      category: 'SALES',
      sortOrder: 70
    }
  })

  console.log(`✅ Application seeded: ${result.key} (${result.name})`)

  // Also seed default templates
  const defaultTemplates = [
    {
      name: 'Neuer Partner - Willkommen',
      description: 'Automatische Vorstellung einer neuen Partnerwerkstatt',
      postType: 'PARTNER_INTRO',
      textTemplate: '🎉 Willkommen im Bereifung24-Netzwerk!\n\n🏪 {{workshopName}} aus {{city}} ist jetzt offizieller Partner!\n\nServices: {{services}}\n\n📍 Jetzt Termin buchen auf bereifung24.de\n\n#Bereifung24 #NeuerPartner #Reifen #{{city}}',
      platforms: JSON.stringify(['FACEBOOK', 'INSTAGRAM']),
    },
    {
      name: 'Saisonaler Reifen-Tipp',
      description: 'KI-generierter Saisontipp zum Reifenwechsel',
      postType: 'TIRE_TIP',
      textTemplate: '💡 Reifen-Tipp von Bereifung24:\n\n{{content}}\n\n🔧 Werkstatt in deiner Nähe finden: bereifung24.de\n\n#Bereifung24 #ReifenTipp #Reifen',
      platforms: JSON.stringify(['FACEBOOK', 'INSTAGRAM', 'LINKEDIN']),
    },
    {
      name: 'Blog-Artikel Promotion',
      description: 'Automatische Vorstellung neuer Blog-Artikel',
      postType: 'BLOG_PROMO',
      textTemplate: '📰 Neuer Artikel auf unserem Blog:\n\n{{blogTitle}}\n\n{{blogExcerpt}}\n\n👉 Jetzt lesen: {{blogUrl}}\n\n#Bereifung24 #Blog #Reifen',
      platforms: JSON.stringify(['FACEBOOK', 'LINKEDIN']),
    },
  ]

  for (const template of defaultTemplates) {
    const existing = await prisma.socialMediaTemplate.findFirst({
      where: { name: template.name }
    })

    if (!existing) {
      await prisma.socialMediaTemplate.create({ data: template })
      console.log(`✅ Template erstellt: ${template.name}`)
    } else {
      console.log(`⏭️ Template existiert bereits: ${template.name}`)
    }
  }

  console.log('\n✨ Social Media Marketing seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
