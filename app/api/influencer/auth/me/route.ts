import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * GET /api/influencer/auth/me
 * Get current influencer session
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('influencer_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as any

    if (decoded.type !== 'influencer') {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 })
    }

    // Get influencer data
    const influencer = await prisma.influencer.findUnique({
      where: { id: decoded.influencerId },
      select: {
        id: true,
        email: true,
        code: true,
        name: true,
        isActive: true,
        isRegistered: true,
        platform: true,
        channelName: true,
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer nicht gefunden' }, { status: 404 })
    }

    if (!influencer.isActive) {
      return NextResponse.json({ error: 'Account deaktiviert' }, { status: 403 })
    }

    return NextResponse.json({ influencer })

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Ungültiges oder abgelaufenes Token' }, { status: 401 })
    }
    
    console.error('[INFLUENCER] Get session error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}
