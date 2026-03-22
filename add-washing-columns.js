// Add washing columns to WorkshopService and DirectBooking tables
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧼 Adding washing columns...')
  
  // WorkshopService: washingPrice and washingAvailable
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "workshop_services" ADD COLUMN IF NOT EXISTS "washing_price" DOUBLE PRECISION`)
    console.log('✅ workshop_services.washing_price added')
  } catch (e) { console.log('⚠️ washing_price may already exist:', e.message) }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "workshop_services" ADD COLUMN IF NOT EXISTS "washing_available" BOOLEAN DEFAULT false`)
    console.log('✅ workshop_services.washing_available added')
  } catch (e) { console.log('⚠️ washing_available may already exist:', e.message) }

  // DirectBooking: hasWashing and washingPrice
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "has_washing" BOOLEAN NOT NULL DEFAULT false`)
    console.log('✅ direct_bookings.has_washing added')
  } catch (e) { console.log('⚠️ has_washing may already exist:', e.message) }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS "washing_price" DECIMAL(65,30)`)
    console.log('✅ direct_bookings.washing_price added')
  } catch (e) { console.log('⚠️ washing_price may already exist:', e.message) }

  console.log('🎉 All washing columns added successfully!')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
