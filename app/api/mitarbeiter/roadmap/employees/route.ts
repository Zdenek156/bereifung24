import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Liste aller Mitarbeiter mit Roadmap-Zugriff
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hole alle Mitarbeiter die Roadmap-Zugriff haben
    const employees = await prisma.b24Employee.findMany({
      where: {
        applications: {
          some: {
            applicationKey: 'roadmap'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    return NextResponse.json({ success: true, data: employees })

  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}
