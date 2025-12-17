import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/analytics/track - Track a page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, fullUrl, pageTitle, referrer, workshopId } = body

    // Get session if user is logged in
    const session = await getServerSession(authOptions)

    // Get IP address (anonymized for privacy - only first 3 octets)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || request.ip
    const anonymizedIp = ip ? ip.split('.').slice(0, 3).join('.') + '.0' : null

    // Get user agent
    const userAgent = request.headers.get('user-agent')

    // Create page view record
    await prisma.pageView.create({
      data: {
        path,
        fullUrl,
        pageTitle,
        referrer,
        workshopId,
        userId: session?.user?.id,
        userRole: session?.user?.role,
        ipAddress: anonymizedIp,
        userAgent: userAgent?.substring(0, 500), // Limit length
        sessionId: null, // Can be added later if needed
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking page view:', error)
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
