import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// PUT /api/freelancer/leads/[id] - Update lead
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const lead = await prisma.freelancerLead.findFirst({
    where: { id: params.id, freelancerId: freelancer.id },
  })

  if (!lead) {
    return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const updates: any = {}

    if (body.workshopName !== undefined) updates.workshopName = body.workshopName
    if (body.contactPerson !== undefined) updates.contactPerson = body.contactPerson
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.email !== undefined) updates.email = body.email
    if (body.address !== undefined) updates.address = body.address
    if (body.zipCode !== undefined) updates.zipCode = body.zipCode
    if (body.city !== undefined) updates.city = body.city
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.nextFollowUp !== undefined) updates.nextFollowUp = body.nextFollowUp ? new Date(body.nextFollowUp) : null
    if (body.lostReason !== undefined) updates.lostReason = body.lostReason

    // Status change
    if (body.status !== undefined && body.status !== lead.status) {
      updates.status = body.status

      // Log status change
      await prisma.freelancerLeadActivity.create({
        data: {
          leadId: lead.id,
          type: 'STATUS_CHANGE',
          description: `Status geändert: ${lead.status} → ${body.status}`,
        }
      })
    }

    const updatedLead = await prisma.freelancerLead.update({
      where: { id: params.id },
      data: updates,
    })

    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (err) {
    console.error('[FREELANCER LEADS] Error:', err)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}

// DELETE /api/freelancer/leads/[id] - Delete lead (only NEW status)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const lead = await prisma.freelancerLead.findFirst({
    where: { id: params.id, freelancerId: freelancer.id },
  })

  if (!lead) {
    return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
  }

  if (lead.status !== 'NEW') {
    return NextResponse.json({ error: 'Nur Leads mit Status NEU können gelöscht werden' }, { status: 400 })
  }

  await prisma.freelancerLead.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}

// GET /api/freelancer/leads/[id] - Get lead detail
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const lead = await prisma.freelancerLead.findFirst({
    where: { id: params.id, freelancerId: freelancer.id },
    include: {
      activities: { orderBy: { createdAt: 'desc' } },
      workshop: { select: { id: true, companyName: true, status: true } },
    },
  })

  if (!lead) {
    return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json({ lead })
}
