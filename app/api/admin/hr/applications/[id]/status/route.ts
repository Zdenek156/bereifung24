import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// PATCH - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['NEW', 'REVIEWING', 'INTERVIEW', 'REJECTED', 'ACCEPTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.jobApplication.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    )
  }
}
