import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1×1 transparentes GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// GET → Open-Tracking-Pixel
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  if (id) {
    try {
      await prisma.prospectOutreachEmail.update({
        where: { id },
        data: {
          openedAt: new Date(),
          openCount: { increment: 1 },
        },
      })
    } catch {
      // unbekannte ID – Pixel trotzdem ausliefern
    }
  }

  return new NextResponse(PIXEL as any, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  })
}
