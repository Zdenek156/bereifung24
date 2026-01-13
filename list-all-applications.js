const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getAllApps() {
  try {
    const apps = await prisma.application.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    
    console.log(`\nGefundene Anwendungen: ${apps.length}\n`)
    console.log('═══════════════════════════════════════════════════════════')
    
    apps.forEach((app, index) => {
      console.log(`[${app.sortOrder}] ${app.name}`)
      console.log(`    Key: ${app.key}`)
      console.log(`    Route: ${app.adminRoute}`)
      console.log(`    Icon: ${app.icon} | Farbe: ${app.color}`)
      console.log(`    Kategorie: ${app.category}`)
      if (app.description) {
        console.log(`    Beschreibung: ${app.description}`)
      }
      console.log('')
    })
    
    console.log('═══════════════════════════════════════════════════════════')
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getAllApps()
