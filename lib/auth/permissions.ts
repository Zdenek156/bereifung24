import { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'

/**
 * Prüft ob der User ADMIN oder CEO ist
 * CEO = B24Employee mit Position "Geschäftsführer"
 */
export async function isAdminOrCEO(session: Session | null): Promise<boolean> {
  if (!session?.user) return false
  
  // ADMIN hat immer Zugriff
  if (session.user.role === 'ADMIN') return true
  
  // Prüfe ob User CEO ist (Position = "Geschäftsführer")
  if (session.user.role === 'B24_EMPLOYEE' && session.user.email) {
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { position: true }
    })
    
    return employee?.position === 'Geschäftsführer'
  }
  
  return false
}

/**
 * Prüft ob der User ADMIN, CEO oder B24_EMPLOYEE ist
 */
export async function isAdminOrEmployee(session: Session | null): Promise<boolean> {
  if (!session?.user) return false
  
  // ADMIN hat immer Zugriff
  if (session.user.role === 'ADMIN') return true
  
  // B24_EMPLOYEE (inkl. CEO) hat Zugriff
  if (session.user.role === 'B24_EMPLOYEE') {
    // Optional: Prüfe ob CEO für erweiterte Rechte
    if (session.user.email) {
      const employee = await prisma.b24Employee.findUnique({
        where: { email: session.user.email },
        select: { position: true }
      })
      
      return employee !== null
    }
    return true
  }
  
  return false
}

/**
 * Synchroner Check (ohne DB-Abfrage) - nur für session.user.role
 * Nutzen wenn bereits bekannt ist dass User B24_EMPLOYEE ist
 */
export function isAdminOrEmployeeSync(session: Session | null): boolean {
  if (!session?.user) return false
  return session.user.role === 'ADMIN' || session.user.role === 'B24_EMPLOYEE'
}
