const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('Adding GoCardless columns to workshops table...')
  
  await p.$executeRawUnsafe(`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "gocardlessCustomerId" TEXT`)
  console.log('  + gocardlessCustomerId')
  
  await p.$executeRawUnsafe(`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "gocardlessMandateId" TEXT`)
  console.log('  + gocardlessMandateId')
  
  await p.$executeRawUnsafe(`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "gocardlessMandateStatus" TEXT`)
  console.log('  + gocardlessMandateStatus')
  
  await p.$executeRawUnsafe(`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "gocardlessMandateRef" TEXT`)
  console.log('  + gocardlessMandateRef')
  
  await p.$executeRawUnsafe(`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "gocardlessMandateCreatedAt" TIMESTAMP(3)`)
  console.log('  + gocardlessMandateCreatedAt')
  
  await p.$executeRawUnsafe(`ALTER TABLE workshops ADD COLUMN IF NOT EXISTS "gocardlessBankAccountId" TEXT`)
  console.log('  + gocardlessBankAccountId')
  
  console.log('✅ All GoCardless columns added!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => p.$disconnect())
