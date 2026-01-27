import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/workshop/tire-requests/[id]/mark-viewed
 * Mark a tire request as viewed by the workshop
 * Used to filter "New" requests (only show requests the workshop hasn't viewed yet)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get workshop ID
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if tire request exists
    const tireRequest = await prisma.tireRequest.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    // Create or update view record (upsert to avoid duplicates)
    await prisma.tireRequestView.upsert({
      where: {
        tireRequestId_workshopId: {
          tireRequestId: params.id,
          workshopId: workshop.id
        }
      },
      create: {
        tireRequestId: params.id,
        workshopId: workshop.id
      },
      update: {
        viewedAt: new Date() // Update viewed timestamp
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking tire request as viewed:', error)
    return NextResponse.json(
      { error: 'Fehler beim Markieren der Anfrage' },
      { status: 500 }
    )
  }
}
