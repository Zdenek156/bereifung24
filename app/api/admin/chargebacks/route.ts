import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/admin/chargebacks?status=open|closed|all&liability=...
export async function GET(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') || 'all'
  const liabilityFilter = searchParams.get('liability') || 'all'

  const where: Record<string, unknown> = {}

  if (statusFilter === 'open') {
    where.status = { in: ['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review'] }
  } else if (statusFilter === 'closed') {
    where.status = { in: ['won', 'lost', 'warning_closed', 'charge_refunded'] }
  }

  if (liabilityFilter !== 'all') {
    where.liability = liabilityFilter
  }

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: [{ disputeCreatedAt: 'desc' }],
    include: {
      directBooking: {
        select: {
          id: true,
          serviceType: true,
          date: true,
          time: true,
          totalPrice: true,
          status: true,
          paymentStatus: true,
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          workshop: { select: { id: true, companyName: true, email: true } },
        },
      },
    },
  })

  // Stats
  const allDisputes = await prisma.dispute.findMany({
    select: { status: true, liability: true, amount: true },
  })
  const openStatuses = ['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review']
  const stats = {
    total: allDisputes.length,
    open: allDisputes.filter(d => openStatuses.includes(d.status)).length,
    won: allDisputes.filter(d => d.outcome === 'won' || d.status === 'won').length,
    lost: allDisputes.filter(d => d.outcome === 'lost' || d.status === 'lost').length,
    workshopLiable: allDisputes.filter(d => d.liability === 'AFTER_APPOINTMENT' && openStatuses.includes(d.status)).length,
    customerLiable: allDisputes.filter(d => d.liability === 'BEFORE_APPOINTMENT' && openStatuses.includes(d.status)).length,
    totalAmountCents: allDisputes.reduce((sum, d) => sum + d.amount, 0),
  }

  return NextResponse.json({ disputes, stats })
}
