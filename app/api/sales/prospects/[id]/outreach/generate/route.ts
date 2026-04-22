import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'
import {
  generateOutreachEmail,
  type OutreachTemplate,
} from '@/lib/sales/aiEmailGenerator'

// POST { templateType, customNotes? } → { subject, body }
// Generiert nur (kein DB-Insert, kein Versand)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({} as any))
  const templateType = (body.templateType || 'FIRST_CONTACT') as OutreachTemplate
  const customNotes = typeof body.customNotes === 'string' ? body.customNotes.slice(0, 2000) : ''

  const prospect = await prisma.prospectWorkshop.findUnique({
    where: { googlePlaceId: params.id },
  })
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

  const previous = await prisma.prospectOutreachEmail.findMany({
    where: { prospectId: prospect.id },
    orderBy: { createdAt: 'asc' },
    take: 8,
    select: { direction: true, subject: true, body: true, sentAt: true },
  })

  let result
  try {
    result = await generateOutreachEmail({
      templateType,
      prospect: {
        name: prospect.name,
        city: prospect.city,
        contactPerson: prospect.contactPerson,
      },
      insights: (prospect.aiInsights as any) || null,
      previousEmails: previous.map((p) => ({
        direction: p.direction as any,
        subject: p.subject,
        body: p.body,
        sentAt: p.sentAt,
      })),
      customNotes,
      senderName: (user as any).firstName
        ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
        : (user as any).name || undefined,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Generierung fehlgeschlagen' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    subject: result.subject,
    body: result.body,
    templateType,
    hasInsights: !!prospect.aiInsights,
  })
}
