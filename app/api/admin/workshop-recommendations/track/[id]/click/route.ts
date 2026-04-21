import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/workshop-recommendations/track/[id]/click?url=<encoded>
 *
 * Tracking-Redirect: registriert CTA-Clicks und leitet zum Ziel weiter.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  // SSRF-Schutz: nur bereifung24.de-Hosts erlauben
  const base = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
  let redirectTo = base + '/dashboard/workshop'
  if (targetUrl) {
    try {
      const parsed = new URL(targetUrl)
      if (parsed.hostname.endsWith('bereifung24.de') || parsed.hostname === new URL(base).hostname) {
        redirectTo = parsed.toString()
      }
    } catch {
      /* ignore, use fallback */
    }
  }

  try {
    const rec = await prisma.workshopRecommendation.findUnique({
      where: { id },
      select: { id: true, clickedCtaAt: true }
    })
    if (rec) {
      await prisma.workshopRecommendation.update({
        where: { id },
        data: {
          clickCount: { increment: 1 },
          clickedCtaAt: rec.clickedCtaAt || new Date(),
        }
      })
    }
  } catch (error) {
    console.error('[recommendation-click-tracking]', error)
  }

  return NextResponse.redirect(redirectTo, { status: 302 })
}
