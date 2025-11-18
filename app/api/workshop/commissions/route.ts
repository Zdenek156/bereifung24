import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/commissions - Get all commissions for the workshop
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get workshop ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Get all commissions with related data
    const commissions = await prisma.commission.findMany({
      where: { workshopId: user.workshop.id },
      include: {
        booking: {
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            tireRequest: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totalPending = commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.commissionAmount, 0)

    const totalBilled = commissions
      .filter(c => c.status === 'BILLED')
      .reduce((sum, c) => sum + c.commissionAmount, 0)

    const totalCollected = commissions
      .filter(c => c.status === 'COLLECTED')
      .reduce((sum, c) => sum + c.commissionAmount, 0)

    const totalAll = commissions.reduce((sum, c) => sum + c.commissionAmount, 0)

    return NextResponse.json({
      commissions,
      summary: {
        totalPending,
        totalBilled,
        totalCollected,
        totalAll,
        count: commissions.length,
      },
    })
  } catch (error) {
    console.error('Commissions fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Provisionen' },
      { status: 500 }
    )
  }
}
