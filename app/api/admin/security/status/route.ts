import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // User aus DB holen um zu prüfen ob Passwort gesetzt ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    })

    // Dummy data - würde aus echter Datenbank/Logs kommen
    const securityData = {
      hasPassword: !!user?.password,
      lastLogins: [],
      failedAttempts: 3,
      activeSessions: 1,
      lastBackup: new Date(),
      sslStatus: 'active' as const,
      outdatedPackages: 0,
      databaseSize: '245 MB'
    }

    return NextResponse.json(securityData)
  } catch (error) {
    console.error('Error fetching security status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
