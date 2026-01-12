/**
 * GET /api/employee/has-application?key=customers
 * Check if current user has access to an application
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasApplication } from '@/lib/applications'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const applicationKey = searchParams.get('key')

    if (!applicationKey) {
      return NextResponse.json(
        { error: 'Application key is required' },
        { status: 400 }
      )
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
