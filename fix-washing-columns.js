// Fix washing column names to match Prisma @map annotations
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing column names...')
  
  // workshop_services: rename washing_price → washingprice (matches @map("washingprice"))
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "workshop_services" RENAME COLUMN "washing_price" TO "washingprice"`)
    console.log('✅ workshop_services: washing_price → washingprice')
  } catch (e) { console.log('⚠️ workshop_services washingprice:', e.message) }

  // workshop_services: rename washing_available → washingavailable (matches @map("washingavailable"))
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "workshop_services" RENAME COLUMN "washing_available" TO "washingavailable"`)
    console.log('✅ workshop_services: washing_available → washingavailable')
  } catch (e) { console.log('⚠️ workshop_services washingavailable:', e.message) }

  // direct_bookings: has_washing already correct (matches @map("has_washing"))
  // direct_bookings: washing_price already correct (matches @map("washing_price"))
  // But fix the decimal precision from DECIMAL(65,30) to DECIMAL(10,2)
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "direct_bookings" ALTER COLUMN "washing_price" TYPE DECIMAL(10,2)`)
    console.log('✅ direct_bookings: washing_price precision fixed to DECIMAL(10,2)')
  } catch (e) { console.log('⚠️ direct_bookings washing_price type:', e.message) }

  console.log('🎉 Column names fixed!')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
