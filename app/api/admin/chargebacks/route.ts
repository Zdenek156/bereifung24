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

  const disputesRaw = await prisma.dispute.findMany({
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
          customer: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          workshop: {
            select: {
              id: true,
              companyName: true,
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  })

  // Flatten user fields so the UI can keep its existing shape
  const disputes = disputesRaw.map((d) => ({
    ...d,
    directBooking: d.directBooking
      ? {
          ...d.directBooking,
          customer: d.directBooking.customer
            ? {
                id: d.directBooking.customer.id,
                firstName: d.directBooking.customer.user?.firstName ?? '',
                lastName: d.directBooking.customer.user?.lastName ?? '',
                email: d.directBooking.customer.user?.email ?? '',
              }
            : null,
          workshop: d.directBooking.workshop
            ? {
                id: d.directBooking.workshop.id,
                companyName: d.directBooking.workshop.companyName ?? '',
                email: d.directBooking.workshop.user?.email ?? '',
              }
            : null,
        }
      : null,
  }))

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
