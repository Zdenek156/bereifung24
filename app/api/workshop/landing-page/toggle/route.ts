import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Toggle landing page status
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { landingPage: true }
    })

    if (!workshop || !workshop.landingPage) {
      return NextResponse.json({ error: 'Landing Page nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 })
    }

    // Update status
    const updatedPage = await prisma.workshopLandingPage.update({
      where: { id: workshop.landingPage.id },
      data: {
        isActive,
        lastPublishedAt: isActive ? new Date() : workshop.landingPage.lastPublishedAt
      }
    })

    return NextResponse.json({ landingPage: updatedPage })
  } catch (error) {
    console.error('POST /api/workshop/landing-page/toggle error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
