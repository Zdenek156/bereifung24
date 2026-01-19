import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// POST - Approve payroll batch
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Parse year-month from ID
    const [year, month] = params.id.split('-').map(Number)

    // Update all payrolls for this period
    const updated = await prisma.payroll.updateMany({
      where: {
        year,
        month,
        status: 'DRAFT'
      },
      data: {
        status: 'APPROVED',
        reviewedById: employee.id
      }
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'No draft payrolls found for this period' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, updated: updated.count })
  } catch (error) {
    console.error('Error approving payroll:', error)
    return NextResponse.json(
      { error: 'Failed to approve payroll' },
      { status: 500 }
    )
  }
}
