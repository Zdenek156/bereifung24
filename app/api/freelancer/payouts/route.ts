import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/payouts - List all payouts
export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const payouts = await prisma.freelancerPayout.findMany({
    where: { freelancerId: freelancer.id },
    orderBy: { period: 'desc' },
  })

  return NextResponse.json({
    payouts: payouts.map(p => ({
      id: p.id,
      period: p.period,
      totalBookings: p.totalBookings,
      totalVolume: Number(p.totalVolume),
      totalCommission: Number(p.totalCommission),
      tier: p.tier,
      status: p.status,
      invoiceUrl: p.invoiceUrl,
      paidAt: p.paidAt,
      statementUrl: p.statementUrl,
      createdAt: p.createdAt,
    })),
  })
}
