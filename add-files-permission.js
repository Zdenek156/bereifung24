const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get all B24Employees
    const employees = await prisma.b24Employee.findMany();
    
    console.log('Found', employees.length, 'employee(s)');
    
    for (const employee of employees) {
      const existing = await prisma.b24EmployeePermission.findFirst({
        where: {
          employeeId: employee.id,
          resource: 'files'
        }
      });
      
      if (!existing) {
        await prisma.b24EmployeePermission.create({
          data: {
            employeeId: employee.id,
            resource: 'files',
            canRead: true,
            canWrite: true,
            canDelete: true
          }
        });
        console.log('✅ Added files permission for', employee.firstName, employee.lastName);
      } else {
        console.log('ℹ️  Files permission already exists for', employee.firstName, employee.lastName);
      }
    }
    
    await prisma.$disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
