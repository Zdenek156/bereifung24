import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/support
 * List all support tickets with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const assignedToId = searchParams.get('assignedToId')

    const where: Record<string, unknown> = {}

    if (status && status !== 'ALL') {
      where.status = status
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority
    }
    if (assignedToId) {
      where.assignedToId = assignedToId
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { message: { contains: search } },
        { subject: { contains: search } },
      ]
    }

    const tickets = await prisma.chatMessage.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Get stats
    const stats = await prisma.chatMessage.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    return NextResponse.json({ tickets, stats })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Tickets' }, { status: 500 })
  }
}
