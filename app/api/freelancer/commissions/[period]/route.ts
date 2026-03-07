import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/commissions/[period] - Detail for a specific period (YYYY-MM)
export async function GET(request: NextRequest, { params }: { params: { period: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const period = params.period

  // Get all commissions for this period
  const commissions = await prisma.freelancerCommission.findMany({
    where: { freelancerId: freelancer.id, period },
    orderBy: { createdAt: 'desc' },
  })

  // Group by workshop
  const byWorkshop = new Map<string, {
    workshopId: string,
    workshopName: string,
    bookings: number,
    totalVolume: number,
    totalCommission: number,
  }>()

  const workshopIds = [...new Set(commissions.map(c => c.workshopId))]
  const workshops = workshopIds.length > 0 ? await prisma.workshop.findMany({
    where: { id: { in: workshopIds } },
    select: { id: true, companyName: true },
  }) : []
  const workshopNameMap = new Map(workshops.map(w => [w.id, w.companyName]))

  commissions.forEach(c => {
    const existing = byWorkshop.get(c.workshopId) || {
      workshopId: c.workshopId,
      workshopName: workshopNameMap.get(c.workshopId) || 'Unbekannt',
      bookings: 0,
      totalVolume: 0,
      totalCommission: 0,
    }
    existing.bookings++
    existing.totalVolume += Number(c.bookingAmount)
    existing.totalCommission += Number(c.freelancerAmount)
    byWorkshop.set(c.workshopId, existing)
  })

  // Payout info
  const payout = await prisma.freelancerPayout.findUnique({
    where: { freelancerId_period: { freelancerId: freelancer.id, period } },
  })

  const totals = commissions.reduce((acc, c) => ({
    bookingAmount: acc.bookingAmount + Number(c.bookingAmount),
    b24Gross: acc.b24Gross + Number(c.b24GrossCommission),
    stripeFee: acc.stripeFee + Number(c.stripeFee),
    b24Net: acc.b24Net + Number(c.b24NetCommission),
    freelancerAmount: acc.freelancerAmount + Number(c.freelancerAmount),
  }), { bookingAmount: 0, b24Gross: 0, stripeFee: 0, b24Net: 0, freelancerAmount: 0 })

  return NextResponse.json({
    period,
    commissionCount: commissions.length,
    totals: {
      bookingAmount: Math.round(totals.bookingAmount * 100) / 100,
      b24GrossCommission: Math.round(totals.b24Gross * 100) / 100,
      stripeFee: Math.round(totals.stripeFee * 100) / 100,
      b24NetCommission: Math.round(totals.b24Net * 100) / 100,
      freelancerAmount: Math.round(totals.freelancerAmount * 100) / 100,
    },
    byWorkshop: Array.from(byWorkshop.values()),
    payout: payout ? {
      status: payout.status,
      tier: payout.tier,
      paidAt: payout.paidAt,
      statementUrl: payout.statementUrl,
      invoiceUrl: payout.invoiceUrl,
    } : null,
  })
}
