import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dummy data - würde aus echter Datenbank/Logs kommen
    const securityData = {
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
