const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 Fixing workshop coordinates...\n')

    // Step 1: Fix Müller Reifenservice specifically
    const muller = await prisma.user.findFirst({
      where: { email: 'bikeanzeigen@gmail.com' },
      include: { workshop: true }
    })

    if (muller && muller.workshop) {
      if (muller.latitude && muller.longitude) {
        await prisma.workshop.update({
          where: { id: muller.workshop.id },
          data: {
            latitude: muller.latitude,
            longitude: muller.longitude
          }
        })
        console.log(`✅ Updated Müller Reifenservice:`)
        console.log(`   User: ${muller.latitude}, ${muller.longitude}`)
        console.log(`   Workshop: Now synced!\n`)
      }
    }

    // Step 2: Fix ALL workshops with NULL coordinates
    const result = await prisma.$executeRaw`
      UPDATE "workshops" w
      SET "latitude" = u."latitude", "longitude" = u."longitude"
      FROM "users" u
      WHERE w."userId" = u.id
        AND w."latitude" IS NULL
        AND u."latitude" IS NOT NULL
        AND u."longitude" IS NOT NULL
    `

    console.log(`✅ Updated ${result} workshops with missing coordinates\n`)

    // Step 3: Show updated Müller workshop
    const updatedMuller = await prisma.workshop.findFirst({
      where: { companyName: { contains: 'Müller' } },
      include: { user: true }
    })

    if (updatedMuller) {
      console.log('📍 Müller Reifenservice after fix:')
      console.log({
        companyName: updatedMuller.companyName,
        status: updatedMuller.status,
        workshopLat: updatedMuller.latitude,
        workshopLon: updatedMuller.longitude,
        userLat: updatedMuller.user.latitude,
        userLon: updatedMuller.user.longitude
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
