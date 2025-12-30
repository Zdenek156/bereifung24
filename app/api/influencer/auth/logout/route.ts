import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/influencer/auth/logout
 * Logout for influencers
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the influencer token cookie
    response.cookies.delete('influencer_token')

    return response

  } catch (error) {
    console.error('[INFLUENCER] Logout error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
