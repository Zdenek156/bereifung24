const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetFlow() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Luxus',
          mode: 'insensitive'
        }
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }

    console.log('🔄 Lösche alte GoCardless Session Daten...')
    
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        gocardlessSessionToken: null,
        gocardlessRedirectFlowId: null
      }
    })

    console.log('✅ Session Daten gelöscht. Bitte neuen Flow starten!')
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetFlow()
