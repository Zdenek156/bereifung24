/**
 * GET /api/employee/applications
 * Get all applications assigned to the current employee
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getEmployeeApplicationsWithDetails } from '@/lib/applications'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN has access to all applications
    if (session.user.role === 'ADMIN') {
      const { getAllApplications } = await import('@/lib/applications')
      const applications = await getAllApplications()
      return NextResponse.json({
        success: true,
        data: applications
      })
    }

    // B24_EMPLOYEE gets their assigned applications
    if (session.user.role === 'B24_EMPLOYEE') {
      const applications = await getEmployeeApplicationsWithDetails(session.user.id)
      return NextResponse.json({
        success: true,
        data: applications
      })
    }

    return NextResponse.json({
      success: true,
      data: []
    })
  } catch (error) {
    console.error('Error fetching employee applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
