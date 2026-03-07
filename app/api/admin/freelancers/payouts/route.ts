import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function requireAdmin(session: any) {
  return session?.user && (session.user.role === 'ADMIN' || session.user.role === 'B24_EMPLOYEE')
}

// GET /api/admin/freelancers/payouts - List all pending/recent payouts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined

  const where: any = {}
  if (status) where.status = status

  const payouts = await prisma.freelancerPayout.findMany({
    where,
    include: {
      freelancer: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({
    payouts: payouts.map(p => ({
      id: p.id,
      freelancerName: `${p.freelancer.user.firstName || ''} ${p.freelancer.user.lastName || ''}`.trim(),
      freelancerEmail: p.freelancer.user.email,
      freelancerId: p.freelancerId,
      amount: Number(p.totalCommission),
      totalBookings: p.totalBookings,
      totalVolume: Number(p.totalVolume),
      status: p.status,
      period: p.period,
      tier: p.tier,
      paidAt: p.paidAt,
      invoiceUrl: p.invoiceUrl,
      statementUrl: p.statementUrl,
      createdAt: p.createdAt,
    })),
  })
}

// POST /api/admin/freelancers/payouts - Mark payout as paid
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { payoutId, action } = await request.json()

  if (!payoutId) {
    return NextResponse.json({ error: 'payoutId ist Pflicht' }, { status: 400 })
  }

  const payout = await prisma.freelancerPayout.findUnique({ where: { id: payoutId } })
  if (!payout) {
    return NextResponse.json({ error: 'Auszahlung nicht gefunden' }, { status: 404 })
  }

  if (action === 'approve') {
    await prisma.freelancerPayout.update({
      where: { id: payoutId },
      data: { status: 'APPROVED' },
    })
    return NextResponse.json({ message: 'Auszahlung genehmigt' })
  }

  if (action === 'pay') {
    await prisma.freelancerPayout.update({
      where: { id: payoutId },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return NextResponse.json({ message: 'Auszahlung als bezahlt markiert' })
  }

  if (action === 'reject') {
    await prisma.freelancerPayout.update({
      where: { id: payoutId },
      data: { status: 'REJECTED' },
    })
    return NextResponse.json({ message: 'Auszahlung abgelehnt' })
  }

  return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
}
