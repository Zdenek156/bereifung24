import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'

interface RouteParams {
  params: { id: string }
}

// GET /api/admin/chargebacks/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      directBooking: {
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          workshop: { select: { id: true, companyName: true, email: true, phone: true, stripeAccountId: true } },
          vehicle: true,
        },
      },
    },
  })

  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ dispute })
}

// PUT /api/admin/chargebacks/[id]
// Body: { internalNotes?: string, evidenceSubmittedAt?: string|null }
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (typeof body.internalNotes === 'string') data.internalNotes = body.internalNotes
  if (body.evidenceSubmittedAt !== undefined) {
    data.evidenceSubmittedAt = body.evidenceSubmittedAt ? new Date(body.evidenceSubmittedAt) : null
  }

  const dispute = await prisma.dispute.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json({ dispute })
}

// POST /api/admin/chargebacks/[id]/sync
// Re-fetches the dispute from Stripe and updates local record (manual refresh)
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const local = await prisma.dispute.findUnique({ where: { id: params.id } })
  if (!local) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const stripeKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })
  const remote = await stripe.disputes.retrieve(local.stripeDisputeId)

  const evidenceDueBy = remote.evidence_details?.due_by
    ? new Date(remote.evidence_details.due_by * 1000)
    : null

  const outcome = (remote.status === 'won' || remote.status === 'lost' || remote.status === 'warning_closed')
    ? remote.status
    : null

  const updated = await prisma.dispute.update({
    where: { id: params.id },
    data: {
      status: remote.status,
      reason: remote.reason,
      amount: remote.amount,
      currency: remote.currency,
      evidenceDueBy,
      ...(outcome ? { outcome } : {}),
    },
  })

  return NextResponse.json({ dispute: updated })
}
