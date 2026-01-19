import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// DELETE - Delete job posting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      )
    }

    if (jobPosting._count.applications > 0) {
      return NextResponse.json(
        { error: 'Cannot delete job posting with applications. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.jobPosting.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job posting:', error)
    return NextResponse.json(
      { error: 'Failed to delete job posting' },
      { status: 500 }
    )
  }
}
