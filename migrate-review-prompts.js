const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // 1. Create ReviewStatus enum
    try {
      await prisma.$executeRawUnsafe(`CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'FLAGGED')`)
      console.log('✅ ReviewStatus enum created')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  ReviewStatus enum already exists')
      } else {
        throw e
      }
    }

    // 2. Add status column to reviews
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE reviews ADD COLUMN status "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED'`)
      console.log('✅ status column added to reviews')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  status column already exists')
      } else {
        throw e
      }
    }

    // 3. Create review_prompts table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS review_prompts (
        id TEXT PRIMARY KEY,
        direct_booking_id TEXT NOT NULL UNIQUE REFERENCES direct_bookings(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
        scheduled_at TIMESTAMP(3) NOT NULL,
        sent_at TIMESTAMP(3),
        completed_at TIMESTAMP(3),
        dismissed_at TIMESTAMP(3),
        expired_at TIMESTAMP(3),
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ review_prompts table created')

    // 4. Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_review_prompts_scheduled ON review_prompts(scheduled_at)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_review_prompts_user ON review_prompts(user_id)`)
    console.log('✅ Indexes created')

    console.log('\n🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
