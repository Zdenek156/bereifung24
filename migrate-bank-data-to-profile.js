/**
 * Migration: Move bank data from B24Employee to EmployeeProfile
 * Run once before removing bank fields from B24Employee schema
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Inline encryption (same as lib/encryption.ts)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'bereifung24-default-key-change-in-production-32bytes'

function encrypt(text) {
  if (!text) return null
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

async function migrateBankData() {
  console.log('🔄 Starting bank data migration...\n')

  try {
    // Get all employees with bank data
    const employees = await prisma.b24Employee.findMany({
      where: {
        OR: [
          { iban: { not: null } },
          { bic: { not: null } },
          { bankName: { not: null } },
        ],
      },
      include: {
        profile: true,
      },
    })

    console.log(`Found ${employees.length} employees with bank data\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const employee of employees) {
      try {
        console.log(`Processing: ${employee.firstName} ${employee.lastName} (${employee.email})`)
        console.log(`  Current B24Employee: iban=${employee.iban || 'null'}, bic=${employee.bic || 'null'}, bankName=${employee.bankName || 'null'}`)

        // Check if profile already has bank data
        if (employee.profile?.bankAccount) {
          console.log(`  ⏭️  Profile already has bankAccount, skipping\n`)
          skipped++
          continue
        }

        // Prepare encrypted bank data
        const profileData = {}
        if (employee.iban) {
          profileData.bankAccount = encrypt(employee.iban)
        }
        if (employee.bic) {
          profileData.bic = employee.bic
        }
        if (employee.bankName) {
          profileData.bankName = employee.bankName
        }

        // Only update if there's data to migrate
        if (Object.keys(profileData).length === 0) {
          console.log(`  ⏭️  No bank data to migrate\n`)
          skipped++
          continue
        }

        // Upsert to EmployeeProfile
        await prisma.employeeProfile.upsert({
          where: {
            employeeId: employee.id,  // Current field name in schema
          },
          create: {
            employeeId: employee.id,  // Current field name in schema
            ...profileData,
          },
          update: profileData,
        })

        console.log(`  ✅ Migrated to EmployeeProfile (encrypted)`)
        console.log(`  New Profile: bankAccount=${profileData.bankAccount ? '[ENCRYPTED]' : 'null'}, bic=${profileData.bic || 'null'}, bankName=${profileData.bankName || 'null'}\n`)
        migrated++
      } catch (error) {
        console.error(`  ❌ Error migrating ${employee.email}:`, error.message, '\n')
        errors++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📋 Total: ${employees.length}`)

    if (errors === 0) {
      console.log('\n✅ Migration completed successfully!')
      console.log('⚠️  Next steps:')
      console.log('   1. Verify data in database')
      console.log('   2. Update Prisma schema to remove B24Employee.{iban, bic, bankName}')
      console.log('   3. Run: npx prisma migrate dev')
      console.log('   4. Deploy changes')
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review and retry.')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateBankData()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
