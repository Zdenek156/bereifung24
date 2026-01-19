import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// POST - Mark payroll as paid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    // Parse year-month from ID
    const [year, month] = params.id.split('-').map(Number)

    // Update all approved payrolls for this period
    const updated = await prisma.payroll.updateMany({
      where: {
        year,
        month,
        status: 'APPROVED'
      },
      data: {
        status: 'PAID'
      }
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'No approved payrolls found for this period' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, updated: updated.count })
  } catch (error) {
    console.error('Error marking payroll as paid:', error)
    return NextResponse.json(
      { error: 'Failed to mark payroll as paid' },
      { status: 500 }
    )
  }
}
