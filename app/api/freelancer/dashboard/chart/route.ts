import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/dashboard/chart?type=bookings|volume|commission
export async function GET(request: NextRequest) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const type = request.nextUrl.searchParams.get('type') || 'bookings'

  // Last 6 months
  const months: { period: string, label: string, startDate: Date, endDate: Date }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    months.push({
      period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      startDate: d,
      endDate: end,
    })
  }

  const workshopIds = (await prisma.workshop.findMany({
    where: { freelancerId: freelancer.id },
    select: { id: true }
  })).map(w => w.id)

  const chartData = await Promise.all(months.map(async (month) => {
    if (type === 'commission') {
      const result = await prisma.freelancerCommission.aggregate({
        where: { freelancerId: freelancer.id, period: month.period },
        _sum: { freelancerAmount: true },
        _count: true,
      })
      return {
        period: month.period,
        label: month.label,
        value: Number(result._sum.freelancerAmount || 0),
        count: result._count,
      }
    }

    // Bookings or volume
    if (workshopIds.length === 0) {
      return { period: month.period, label: month.label, value: 0, count: 0 }
    }

    const bookings = await prisma.directBooking.findMany({
      where: {
        workshopId: { in: workshopIds },
        createdAt: { gte: month.startDate, lte: month.endDate },
        status: { not: 'CANCELLED' },
      },
      select: { id: true, totalPrice: true }
    })

    if (type === 'volume') {
      const totalVolume = bookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0)
      return { period: month.period, label: month.label, value: Math.round(totalVolume * 100) / 100, count: bookings.length }
    }

    return { period: month.period, label: month.label, value: bookings.length, count: bookings.length }
  }))

  return NextResponse.json({ type, data: chartData })
}
