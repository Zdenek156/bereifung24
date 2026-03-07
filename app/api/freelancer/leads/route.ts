import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/leads - List all leads
export async function GET(request: NextRequest) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const search = request.nextUrl.searchParams.get('search') || ''
  const statusFilter = request.nextUrl.searchParams.get('status') || ''
  const sort = request.nextUrl.searchParams.get('sort') || 'updatedAt'
  const order = request.nextUrl.searchParams.get('order') || 'desc'

  const where: any = { freelancerId: freelancer.id }
  if (search) {
    where.OR = [
      { workshopName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (statusFilter) {
    where.status = statusFilter
  }

  const leads = await prisma.freelancerLead.findMany({
    where,
    include: {
      activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { activities: true } },
    },
    orderBy: { [sort]: order },
  })

  return NextResponse.json({
    leads: leads.map(lead => ({
      id: lead.id,
      workshopName: lead.workshopName,
      contactPerson: lead.contactPerson,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      zipCode: lead.zipCode,
      city: lead.city,
      status: lead.status,
      lostReason: lead.lostReason,
      nextFollowUp: lead.nextFollowUp,
      notes: lead.notes,
      workshopId: lead.workshopId,
      activityCount: lead._count.activities,
      lastActivity: lead.activities[0] || null,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    })),
    total: leads.length,
  })
}

// POST /api/freelancer/leads - Create new lead
export async function POST(request: NextRequest) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  try {
    const body = await request.json()

    if (!body.workshopName) {
      return NextResponse.json({ error: 'Werkstattname ist erforderlich' }, { status: 400 })
    }

    const lead = await prisma.freelancerLead.create({
      data: {
        freelancerId: freelancer.id,
        workshopName: body.workshopName,
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        zipCode: body.zipCode || null,
        city: body.city || null,
        status: 'NEW',
        notes: body.notes || null,
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      },
    })

    // Create initial activity
    await prisma.freelancerLeadActivity.create({
      data: {
        leadId: lead.id,
        type: 'NOTE',
        description: 'Lead erstellt',
      }
    })

    return NextResponse.json({ success: true, lead }, { status: 201 })
  } catch (err) {
    console.error('[FREELANCER LEADS] Error:', err)
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 })
  }
}
