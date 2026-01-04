import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Nur B24_EMPLOYEE dürfen auf diese API zugreifen
    if (session.user.role !== 'B24_EMPLOYEE' || !session.user.b24EmployeeId) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Hole alle Permissions für diesen Mitarbeiter
    const permissions = await prisma.b24EmployeePermission.findMany({
      where: {
        employeeId: session.user.b24EmployeeId,
        canRead: true // Nur Permissions mit Lesezugriff
      },
      select: {
        resource: true,
        canRead: true,
        canWrite: true,
        canDelete: true
      }
    })

    // Konvertiere zu Set für schnelle Lookup
    const accessibleResources = permissions.map(p => p.resource)

    return NextResponse.json({ 
      permissions,
      accessibleResources 
    })
  } catch (error) {
    console.error('Error fetching employee permissions:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Berechtigungen' }, { status: 500 })
  }
}
