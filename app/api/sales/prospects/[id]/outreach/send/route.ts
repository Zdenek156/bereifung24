import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'
import {
  sendOutreachEmail,
  generateMessageId,
  getOutreachSmtpConfig,
} from '@/lib/sales/outreachMailer'
import { bodyToHtml } from '@/lib/sales/aiEmailGenerator'

// POST { subject, body, templateType, toEmail?, inReplyToEmailId? }
// Sendet die finale Email + speichert ProspectOutreachEmail (status=SENT)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payload = await req.json().catch(() => ({} as any))
  const subject = String(payload.subject || '').trim().slice(0, 300)
  const bodyText = String(payload.body || '').trim()
  const templateType = String(payload.templateType || 'CUSTOM')
  const toEmailOverride = payload.toEmail ? String(payload.toEmail).trim() : null
  const inReplyToEmailId = payload.inReplyToEmailId
    ? String(payload.inReplyToEmailId)
    : null

  if (!subject || !bodyText) {
    return NextResponse.json(
      { error: 'Subject und Body sind erforderlich' },
      { status: 400 }
    )
  }

  const prospect = await prisma.prospectWorkshop.findUnique({
    where: { googlePlaceId: params.id },
  })
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

  const toEmail = toEmailOverride || prospect.email
  if (!toEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toEmail)) {
    return NextResponse.json(
      { error: 'Keine gültige Empfänger-Email vorhanden' },
      { status: 400 }
    )
  }

  // Threading-Daten
  let inReplyTo: string | null = null
  let references: string[] = []
  let threadId: string | null = null
  if (inReplyToEmailId) {
    const prev = await prisma.prospectOutreachEmail.findUnique({
      where: { id: inReplyToEmailId },
      select: { messageId: true, threadId: true },
    })
    if (prev) {
      inReplyTo = prev.messageId
      references = [prev.messageId]
      threadId = prev.threadId || prev.messageId
    }
  }

  const cfg = await getOutreachSmtpConfig()
  if (!cfg) {
    return NextResponse.json(
      {
        error:
          'Partner-Mailbox nicht konfiguriert. Bitte OUTREACH_SMTP_* in Admin-API-Settings hinterlegen.',
      },
      { status: 503 }
    )
  }

  const messageId = generateMessageId()
  if (!threadId) threadId = messageId

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://bereifung24.de'
  // Wir erzeugen die DB-Row erst NACH Versand (für stabile ID), aber Tracking-URLs
  // brauchen die ID. Daher: zwei-Phasen → zuerst Row als DRAFT mit messageId, dann senden.

  const created = await prisma.prospectOutreachEmail.create({
    data: {
      prospectId: prospect.id,
      direction: 'OUTBOUND',
      templateType,
      sentById: (user as any).id !== 'admin' ? (user as any).id : null,
      fromEmail: cfg.fromEmail,
      toEmail,
      subject,
      body: bodyText,
      messageId,
      inReplyTo,
      threadId,
      status: 'DRAFT',
      aiGenerated: !!payload.aiGenerated,
      aiInsightsSnapshot: (prospect.aiInsights as any) || undefined,
    },
  })

  const trackingPixelUrl = `${baseUrl}/api/sales/outreach/track/${created.id}/open`
  const clickRedirectBase = `${baseUrl}/api/sales/outreach/track/${created.id}/click`
  const html = bodyToHtml(bodyText, { trackingPixelUrl, clickRedirectBase })

  const sendResult = await sendOutreachEmail({
    to: toEmail,
    subject,
    text: bodyText,
    html,
    messageId,
    inReplyTo,
    references,
  })

  if (!sendResult.success) {
    await prisma.prospectOutreachEmail.update({
      where: { id: created.id },
      data: { status: 'FAILED', errorMessage: sendResult.error || 'unbekannt' },
    })
    return NextResponse.json(
      { error: sendResult.error || 'SMTP-Versand fehlgeschlagen', emailId: created.id },
      { status: 502 }
    )
  }

  await prisma.$transaction([
    prisma.prospectOutreachEmail.update({
      where: { id: created.id },
      data: { status: 'SENT', sentAt: new Date(), bodyHtml: html },
    }),
    prisma.prospectWorkshop.update({
      where: { id: prospect.id },
      data: {
        lastContactDate: new Date(),
        firstContactDate: prospect.firstContactDate || new Date(),
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    emailId: created.id,
    messageId,
    threadId,
  })
}
