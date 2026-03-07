import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function requireAdmin(session: any) {
  return session?.user && (session.user.role === 'ADMIN' || session.user.role === 'B24_EMPLOYEE')
}

// GET /api/admin/freelancers/[id] - Get freelancer details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const freelancer = await prisma.freelancer.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } },
      workshops: {
        select: {
          id: true,
          companyName: true,
          createdAt: true,
          freelancerAcquiredAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      leads: {
        select: {
          id: true,
          workshopName: true,
          status: true,
          contactPerson: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      commissions: {
        orderBy: { createdAt: 'desc' },
        take: 12,
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
    },
  })

  if (!freelancer) {
    return NextResponse.json({ error: 'Freelancer nicht gefunden' }, { status: 404 })
  }

  const totalCommission = freelancer.commissions.reduce((s, c) => s + c.freelancerAmount.toNumber(), 0)

  return NextResponse.json({
    freelancer: {
      id: freelancer.id,
      tier: freelancer.tier,
      status: freelancer.status,
      phone: freelancer.phone,
      region: freelancer.region,
      companyName: freelancer.companyName,
      affiliateCode: freelancer.affiliateCode,
      taxNumber: freelancer.taxNumber,
      iban: freelancer.iban ? `${freelancer.iban.substring(0, 4)}****${freelancer.iban.slice(-4)}` : null,
      bankName: freelancer.bankName,
      createdAt: freelancer.createdAt,
      user: freelancer.user,
      workshops: freelancer.workshops,
      leads: freelancer.leads,
      recentCommissions: freelancer.commissions,
      payouts: freelancer.payouts,
      totalCommission,
    },
  })
}

// PUT /api/admin/freelancers/[id] - Update freelancer
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const body = await request.json()
  const { tier, status, region, phone, companyName } = body

  const data: any = {}
  if (tier) data.tier = tier
  if (status) data.status = status
  if (region !== undefined) data.region = region
  if (phone !== undefined) data.phone = phone
  if (companyName !== undefined) data.companyName = companyName

  const updated = await prisma.freelancer.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json({ freelancer: updated })
}

// DELETE /api/admin/freelancers/[id] - Deactivate freelancer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  await prisma.freelancer.update({
    where: { id: params.id },
    data: { status: 'TERMINATED' },
  })

  return NextResponse.json({ message: 'Freelancer beendet' })
}
