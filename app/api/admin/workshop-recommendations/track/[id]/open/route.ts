import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

/**
 * GET /api/admin/workshop-recommendations/track/[id]/open
 *
 * Tracking-Pixel: registriert Email-Opens.
 * Antwort ist immer ein 1x1 GIF (auch bei Fehlern), damit Email-Client nichts merkt.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const rec = await prisma.workshopRecommendation.findUnique({
      where: { id },
      select: { id: true, openedAt: true }
    })
    if (rec) {
      await prisma.workshopRecommendation.update({
        where: { id },
        data: {
          openCount: { increment: 1 },
          openedAt: rec.openedAt || new Date(),
        }
      })
    }
  } catch (error) {
    console.error('[recommendation-open-tracking]', error)
  }

  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRACKING_PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
    }
  })
}
