import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function getSalesUser() {
  const session = await getServerSession(authOptions);
  
  console.log('[SALES AUTH] Session check:', {
    hasSession: !!session,
    email: session?.user?.email,
    role: session?.user?.role,
    name: session?.user?.name
  });
  
  if (!session?.user?.email) {
    console.log('[SALES AUTH] No session or email');
    return null;
  }

  // Check if admin by role OR by email (for backward compatibility)
  if (session.user.role === 'ADMIN' || session.user.email === 'admin@bereifung24.de') {
    console.log('[SALES AUTH] User is ADMIN - granting access');
    // Create a virtual employee object for admin with full access
    return {
      id: 'admin',
      email: session.user.email,
      name: session.user.name || 'Admin',
      isActive: true,
      isAdmin: true
    };
  }

  console.log('[SALES AUTH] Not admin, checking B24Employee');
  // Check if B24Employee
  const employee = await prisma.b24Employee.findUnique({
    where: { email: session.user.email }
  });

  if (!employee || !employee.isActive) {
    console.log('[SALES AUTH] No active B24Employee found');
    return null;
  }

  console.log('[SALES AUTH] B24Employee found:', employee.id);
  return {
    ...employee,
    isAdmin: false
  };
}
