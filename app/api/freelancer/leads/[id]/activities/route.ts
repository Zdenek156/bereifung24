import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/leads/[id]/activities - Get lead activities
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  // Verify lead belongs to this freelancer
  const lead = await prisma.freelancerLead.findFirst({
    where: { id: params.id, freelancerId: freelancer.id },
  })
  if (!lead) return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })

  const activities = await prisma.freelancerLeadActivity.findMany({
    where: { leadId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ activities })
}

// POST /api/freelancer/leads/[id]/activities - Add activity to lead
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const lead = await prisma.freelancerLead.findFirst({
    where: { id: params.id, freelancerId: freelancer.id },
  })
  if (!lead) return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 })

  try {
    const body = await request.json()
    if (!body.type || !body.description) {
      return NextResponse.json({ error: 'Typ und Beschreibung erforderlich' }, { status: 400 })
    }

    const validTypes = ['CALL', 'EMAIL', 'VISIT', 'NOTE', 'STATUS_CHANGE']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: 'Ungültiger Aktivitätstyp' }, { status: 400 })
    }

    const activity = await prisma.freelancerLeadActivity.create({
      data: {
        leadId: params.id,
        type: body.type,
        description: body.description,
      }
    })

    // Update lead's updatedAt
    await prisma.freelancerLead.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true, activity }, { status: 201 })
  } catch (err) {
    console.error('[FREELANCER LEAD ACTIVITY] Error:', err)
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
