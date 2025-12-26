const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  console.log('Admin User:', { 
    id: admin.id, 
    email: admin.email, 
    role: admin.role 
  });
  
  const employee = await prisma.b24Employee.findUnique({
    where: { email: admin.email }
  });
  
  if (employee) {
    console.log('B24Employee found:', { 
      id: employee.id, 
      email: employee.email, 
      isActive: employee.isActive,
      emailVerified: employee.emailVerified
    });
  } else {
    console.log('B24Employee: NOT FOUND');
  }
  
  await prisma.$disconnect();
}

check();
