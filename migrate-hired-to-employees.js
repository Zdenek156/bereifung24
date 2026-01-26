const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateHiredApplications() {
  console.log('🔄 Migrating HIRED applications to employee drafts...\n')
  
  try {
    // Get all HIRED applications
    const hiredApplications = await prisma.jobApplication.findMany({
      where: { status: 'HIRED' },
      include: { jobPosting: true }
    })

    console.log(`Found ${hiredApplications.length} HIRED applications\n`)

    for (const app of hiredApplications) {
      console.log(`Processing: ${app.firstName} ${app.lastName} (${app.email})`)
      
      // Check if employee already exists with this email
      const existingEmployee = await prisma.b24Employee.findUnique({
        where: { email: app.email }
      })

      if (existingEmployee) {
        console.log(`  ⚠️  Employee already exists (ID: ${existingEmployee.id})`)
        console.log(`  Skipping...\n`)
        continue
      }

      // Create employee draft
      const newEmployee = await prisma.b24Employee.create({
        data: {
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          phone: app.phone || '',
          position: app.jobPosting.title,
          department: app.jobPosting.department,
          status: 'DRAFT', // Draft status - needs to be completed by HR
          password: '', // Will be set during onboarding
        }
      })

      console.log(`  ✅ Employee draft created (ID: ${newEmployee.id})`)
      console.log(`  Status: DRAFT - Position: ${newEmployee.position}\n`)
    }

    console.log('✅ Migration complete!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateHiredApplications()
  .catch(console.error)
