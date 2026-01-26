import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// DELETE - Delete application (only allowed for REJECTED applications)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const application = await prisma.jobApplication.findUnique({
      where: { id: params.id }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of rejected applications
    if (application.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Only rejected applications can be deleted' },
        { status: 400 }
      )
    }

    await prisma.jobApplication.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Application deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting application:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete application' },
      { status: 500 }
    )
  }
}
