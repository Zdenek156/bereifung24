import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/support/[id]
 * Get single ticket details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket nicht gefunden' }, { status: 404 })
    }

    // Mark as READ if still NEW
    if (ticket.status === 'NEW') {
      await prisma.chatMessage.update({
        where: { id: params.id },
        data: { status: 'READ' },
      })
    }

    // Fetch assignedTo user name if set
    // Note: assignedToId is a new column - cast to any until migration runs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ticketAny = ticket as any
    let assignedToName: string | null = null
    if (ticketAny.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: ticketAny.assignedToId },
        select: { firstName: true, lastName: true, email: true },
      })
      assignedToName = assignedUser
        ? `${assignedUser.firstName} ${assignedUser.lastName}`.trim() || assignedUser.email
        : null
    }

    // Fetch repliedBy user name if set
    let repliedByName: string | null = null
    if (ticket.repliedBy) {
      const repliedUser = await prisma.user.findUnique({
        where: { id: ticket.repliedBy },
        select: { firstName: true, lastName: true, email: true },
      })
      repliedByName = repliedUser
        ? `${repliedUser.firstName} ${repliedUser.lastName}`.trim() || repliedUser.email
        : null
    }

    return NextResponse.json({
      ticket: {
        ...ticketAny,
        status: ticket.status === 'NEW' ? 'READ' : ticket.status,
      },
      assignedToName,
      repliedByName,
    })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/support/[id]
 * Update ticket (status, priority, assignedToId, internalNotes, subject)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, priority, assignedToId, internalNotes, subject } = body

    const updatedTicket = await (prisma.chatMessage as any).update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(subject !== undefined && { subject }),
      },
    })

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}
