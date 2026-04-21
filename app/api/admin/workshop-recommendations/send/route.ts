import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { sendEmail } from '@/lib/email'
import { workshopRecommendationEmailTemplate } from '@/lib/email/workshopRecommendationTemplate'

/**
 * POST /api/admin/workshop-recommendations/send
 *
 * Body: {
 *   workshopId, subject, body,
 *   adminNotes, topics?, tone, language,
 *   ctaLabel?: string
 * }
 *
 * Sendet die Email an die Werkstatt, erstellt DB-Record mit Tracking-Hooks.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const session = await getServerSession(authOptions)
  const sentById = (session?.user as any)?.b24EmployeeId || null
  const sentByName = session?.user
    ? `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() ||
      session.user.name ||
      session.user.email ||
      null
    : null

  try {
    const body = await req.json()
    const {
      workshopId,
      subject,
      body: emailBody,
      adminNotes,
      topics,
      tone = 'FRIENDLY',
      language = 'de',
      ctaLabel,
    } = body

    if (!workshopId || !subject?.trim() || !emailBody?.trim()) {
      return NextResponse.json({ error: 'workshopId, subject und body sind Pflicht' }, { status: 400 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { user: { select: { email: true, firstName: true, lastName: true } } }
    })
    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const recipientEmail = workshop.user.email
    const recipientName = `${workshop.user.firstName} ${workshop.user.lastName}`.trim() || workshop.companyName

    // Get sender email for signature
    let senderEmail: string | undefined
    if (sentById) {
      const emp = await prisma.b24Employee.findUnique({
        where: { id: sentById },
        select: { email: true, firstName: true, lastName: true }
      })
      senderEmail = emp?.email || undefined
    }

    // Pre-create record (DRAFT) to get ID for tracking URLs
    const rec = await prisma.workshopRecommendation.create({
      data: {
        workshopId,
        sentById,
        sentByName,
        adminNotes: adminNotes || '',
        topics: Array.isArray(topics) ? JSON.stringify(topics) : null,
        tone,
        language,
        generatedSubject: subject,
        generatedBody: emailBody,
        finalSubject: subject,
        finalBody: emailBody,
        finalHtml: '', // filled below
        recipientEmail,
        recipientName,
        status: 'DRAFT',
      }
    })

    const base = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
    const trackingPixelUrl = `${base}/api/admin/workshop-recommendations/track/${rec.id}/open`
    const ctaTargetUrl = `${base}/dashboard/workshop`
    const ctaUrl = `${base}/api/admin/workshop-recommendations/track/${rec.id}/click?url=${encodeURIComponent(ctaTargetUrl)}`

    const html = workshopRecommendationEmailTemplate({
      recipientName,
      companyName: workshop.companyName,
      bodyText: emailBody,
      ctaUrl,
      ctaLabel,
      trackingPixelUrl,
      senderName: sentByName || undefined,
      senderEmail,
    })

    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        html,
      })

      await prisma.workshopRecommendation.update({
        where: { id: rec.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          finalHtml: html,
          ctaUrl: ctaTargetUrl,
        }
      })

      return NextResponse.json({ success: true, id: rec.id })
    } catch (sendError: any) {
      await prisma.workshopRecommendation.update({
        where: { id: rec.id },
        data: {
          status: 'FAILED',
          errorMessage: sendError?.message || String(sendError),
          finalHtml: html,
        }
      })
      return NextResponse.json(
        { error: 'Email-Versand fehlgeschlagen', details: sendError?.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[workshop-recommendations/send]', error)
    return NextResponse.json({ error: error?.message || 'Unerwarteter Fehler' }, { status: 500 })
  }
}
