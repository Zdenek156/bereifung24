/**
 * Migration Script: Add Commission Tracking Columns
 * Adds platform_commission, workshop_payout, and related fields to direct_bookings table
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting migration: Add commission tracking columns...')

  try {
    // Check if columns already exist
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'direct_bookings' 
      AND column_name IN ('platform_commission', 'workshop_payout')
    `)

    if (checkResult.length > 0) {
      console.log('✅ Columns already exist! No migration needed.')
      const existing = checkResult.map(r => r.column_name).join(', ')
      console.log(`   Found columns: ${existing}`)
      process.exit(0)
    }

    console.log('📝 Adding commission tracking columns...')

    // Add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE direct_bookings 
      ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS platform_commission_cents INT,
      ADD COLUMN IF NOT EXISTS workshop_payout DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS stripe_fees_estimate DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS platform_net_commission DECIMAL(10, 2)
    `)

    console.log('✅ Columns added successfully!')

    // Add index
    console.log('📝 Creating index...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_direct_bookings_platform_commission 
      ON direct_bookings(platform_commission, payment_status)
    `)

    console.log('✅ Index created successfully!')

    // Verify columns were added
    const verifyResult = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'direct_bookings' 
      AND column_name IN (
        'platform_commission', 
        'platform_commission_cents',
        'workshop_payout', 
        'stripe_fees_estimate',
        'platform_net_commission'
      )
      ORDER BY column_name
    `)

    console.log('\n📊 Migration complete! Added columns:')
    verifyResult.forEach(col => {
      console.log(`   ✓ ${col.column_name} (${col.data_type})`)
    })

    console.log('\n✅ All done! Commission tracking is now enabled.')
    console.log('💡 Future bookings will automatically track the 6.9% commission split.')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
