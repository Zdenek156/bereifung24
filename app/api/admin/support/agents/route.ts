import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/support/agents
 * Get list of B24 employees and admins who can be assigned to tickets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agents = await prisma.user.findMany({
      where: {
        role: 'B24_EMPLOYEE',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
