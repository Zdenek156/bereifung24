import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// PATCH - Toggle job posting active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: params.id }
    })

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.jobPosting.update({
      where: { id: params.id },
      data: {
        isActive: !jobPosting.isActive,
        publishedAt: !jobPosting.isActive ? new Date() : jobPosting.publishedAt
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error toggling job posting:', error)
    return NextResponse.json(
      { error: 'Failed to toggle job posting' },
      { status: 500 }
    )
  }
}
