import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Alle Roadmap Phasen abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prüfe ob Mitarbeiter existiert
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Lade alle Phasen sortiert nach Order
    const phases = await prisma.roadmapPhase.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
        order: true,
        startMonth: true,
        endMonth: true
      }
    })

    return NextResponse.json({
      success: true,
      data: phases
    })

  } catch (error) {
    console.error('Error fetching phases:', error)
    return NextResponse.json({ error: 'Failed to fetch phases' }, { status: 500 })
  }
}
