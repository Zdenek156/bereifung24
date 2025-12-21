import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function getSalesUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  // Check if admin (role is string, not enum)
  if (session.user.role === 'ADMIN') {
    // Create a virtual employee object for admin with full access
    return {
      id: 'admin',
      email: session.user.email,
      name: session.user.name || 'Admin',
      isActive: true,
      isAdmin: true
    };
  }

  // Check if B24Employee
  const employee = await prisma.b24Employee.findUnique({
    where: { email: session.user.email }
  });

  if (!employee || !employee.isActive) {
    return null;
  }

  return {
    ...employee,
    isAdmin: false
  };
}
