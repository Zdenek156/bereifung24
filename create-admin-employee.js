const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminEmployee() {
  try {
    // Find admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`Found ${adminUsers.length} admin users`);

    for (const user of adminUsers) {
      // Check if B24Employee already exists with this email
      const existingEmployee = await prisma.b24Employee.findUnique({
        where: { email: user.email }
      });

      if (existingEmployee) {
        console.log(`B24Employee already exists for ${user.email}`);
        continue;
      }

      // Create B24Employee profile for admin
      const employee = await prisma.b24Employee.create({
        data: {
          firstName: user.firstName || 'Admin',
          lastName: user.lastName || 'User',
          email: user.email,
          isActive: true,
          emailVerified: true
        }
      });

      console.log(`✅ Created B24Employee profile for ${user.email} (ID: ${employee.id})`);

      // Add all permissions for this admin employee
      const resources = [
        'customers', 'workshops', 'analytics', 'billing', 'email-templates',
        'email', 'territories', 'commissions', 'security', 'api-settings',
        'sepa-mandates', 'notifications', 'cleanup', 'b24-employees', 'sales-crm',
        'kvp', 'files'
      ];

      for (const resource of resources) {
        await prisma.b24EmployeePermission.create({
          data: {
            employeeId: employee.id,
            resource,
            canRead: true,
            canWrite: true,
            canDelete: true
          }
        });
      }

      console.log(`✅ Added all permissions for ${user.email}`);
    }

    console.log('\n🎉 All admin users now have B24Employee profiles');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminEmployee();
