import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/commissions - Monthly commission overview
export async function GET(request: NextRequest) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '12')

  // Get all commissions grouped by period
  const commissions = await prisma.freelancerCommission.groupBy({
    by: ['period'],
    where: { freelancerId: freelancer.id },
    _sum: {
      bookingAmount: true,
      b24NetCommission: true,
      freelancerAmount: true,
    },
    _count: true,
    orderBy: { period: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  // Get payout status for each period
  const periods = commissions.map(c => c.period)
  const payouts = await prisma.freelancerPayout.findMany({
    where: { freelancerId: freelancer.id, period: { in: periods } },
    select: { period: true, status: true, tier: true, paidAt: true },
  })
  const payoutMap = new Map(payouts.map(p => [p.period, p]))

  const total = await prisma.freelancerCommission.groupBy({
    by: ['period'],
    where: { freelancerId: freelancer.id },
  })

  return NextResponse.json({
    commissions: commissions.map(c => ({
      period: c.period,
      bookingCount: c._count,
      totalVolume: Number(c._sum.bookingAmount || 0),
      b24NetCommission: Number(c._sum.b24NetCommission || 0),
      freelancerAmount: Number(c._sum.freelancerAmount || 0),
      payout: payoutMap.get(c.period) || null,
    })),
    pagination: {
      page,
      limit,
      total: total.length,
      pages: Math.ceil(total.length / limit),
    },
  })
}
