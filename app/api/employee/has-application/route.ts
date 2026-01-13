/**
 * GET /api/employee/has-application?key=customers
 * Check if current user has access to an application
 * Supports both session-based and header-based authentication (for middleware)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasApplication } from '@/lib/applications'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const applicationKey = searchParams.get('key')

    if (!applicationKey) {
      return NextResponse.json(
        { error: 'Application key is required' },
        { status: 400 }
      )
    }

    // Check if this is a middleware request (has x-user-id header)
    const userIdHeader = req.headers.get('x-user-id')
    const userRoleHeader = req.headers.get('x-user-role')

    if (userIdHeader && userRoleHeader) {
      // Middleware request - use headers
      if (userRoleHeader === 'ADMIN') {
        return NextResponse.json({ success: true, hasAccess: true })
      }

      const hasAccess = await hasApplication(userIdHeader, applicationKey)
      return NextResponse.json({ success: true, hasAccess })
    }

    // Regular request - use session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN has access to everything
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({ success: true, hasAccess: true })
    }

    const hasAccess = await hasApplication(session.user.id, applicationKey)

    return NextResponse.json({
      success: true,
      hasAccess
    })
  } catch (error) {
    console.error('Error checking application access:', error)
    return NextResponse.json(
      { error: 'Failed to check application access' },
      { status: 500 }
    )
  }
}
