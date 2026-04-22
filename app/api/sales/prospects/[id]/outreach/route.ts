import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'

// GET → Liste aller Outreach-Emails (OUTBOUND + INBOUND) für diesen Prospect
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const prospect = await prisma.prospectWorkshop.findUnique({
    where: { googlePlaceId: params.id },
    select: { id: true, email: true, contactPerson: true, aiInsights: true, websiteAnalyzedAt: true },
  })
  if (!prospect) {
    return NextResponse.json({ emails: [], prospect: null })
  }

  const emails = await prisma.prospectOutreachEmail.findMany({
    where: { prospectId: prospect.id },
    orderBy: { createdAt: 'asc' },
    include: {
      sentBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json({
    prospect: {
      id: prospect.id,
      email: prospect.email,
      contactPerson: prospect.contactPerson,
      hasInsights: !!prospect.aiInsights,
      insights: prospect.aiInsights,
      websiteAnalyzedAt: prospect.websiteAnalyzedAt,
    },
    emails: emails.map((e) => ({
      id: e.id,
      direction: e.direction,
      templateType: e.templateType,
      status: e.status,
      subject: e.subject,
      body: e.body,
      fromEmail: e.fromEmail,
      toEmail: e.toEmail,
      messageId: e.messageId,
      threadId: e.threadId,
      sentAt: e.sentAt?.toISOString() || null,
      openedAt: e.openedAt?.toISOString() || null,
      openCount: e.openCount,
      clickedAt: e.clickedAt?.toISOString() || null,
      clickCount: e.clickCount,
      repliedAt: e.repliedAt?.toISOString() || null,
      errorMessage: e.errorMessage,
      aiGenerated: e.aiGenerated,
      sentByName: e.sentBy
        ? `${e.sentBy.firstName || ''} ${e.sentBy.lastName || ''}`.trim()
        : null,
      createdAt: e.createdAt.toISOString(),
    })),
  })
}
