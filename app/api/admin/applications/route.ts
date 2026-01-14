/**
 * GET /api/admin/applications
 * Get all applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllApplications } from '@/lib/applications'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow both ADMIN and B24_EMPLOYEE to view applications
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const applications = await getAllApplications(includeInactive)

    return NextResponse.json({
      success: true,
      data: applications
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
