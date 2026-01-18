/**
 * GET /api/admin/hr/employee-applications/[employeeId]
 * Get employee's assigned applications
 * 
 * POST /api/admin/hr/employee-applications/[employeeId]
 * Assign application to employee
 * Body: { applicationKey: string }
 * 
 * DELETE /api/admin/hr/employee-applications/[employeeId]
 * Unassign application from employee
 * Body: { applicationKey: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getEmployeeApplicationsWithDetails,
  assignApplication,
  unassignApplication
} from '@/lib/applications'

export async function GET(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Allow ADMIN or B24EMPLOYEE with HR permissions
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is ADMIN or has HR/Admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applications = await getEmployeeApplicationsWithDetails(params.employeeId)

    return NextResponse.json({
      success: true,
      data: applications
    })
  } catch (error) {
    console.error('Error fetching employee applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee applications' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { applicationKey } = body

    if (!applicationKey) {
      return NextResponse.json(
        { error: 'applicationKey is required' },
        { status: 400 }
      )
    }

    const assignment = await assignApplication(
      params.employeeId,
      applicationKey,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: assignment
    })
  } catch (error) {
    console.error('Error assigning application:', error)
    return NextResponse.json(
      { error: 'Failed to assign application' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { applicationKey } = body

    if (!applicationKey) {
      return NextResponse.json(
        { error: 'applicationKey is required' },
        { status: 400 }
      )
    }

    await unassignApplication(params.employeeId, applicationKey)

    return NextResponse.json({
      success: true,
      message: 'Application unassigned successfully'
    })
  } catch (error) {
    console.error('Error unassigning application:', error)
    return NextResponse.json(
      { error: 'Failed to unassign application' },
      { status: 500 }
    )
  }
}
