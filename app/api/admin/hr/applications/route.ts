import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET - List applications
export async function GET(request: NextRequest) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')

    const where: any = {}
    if (jobId) where.jobPostingId = jobId
    if (status && status !== 'ALL') where.status = status

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match frontend interface
    const transformed = applications.map(app => ({
      id: app.id,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumePath,
      status: app.status,
      notes: app.notes,
      jobPosting: {
        id: app.jobPosting.id,
        title: app.jobPosting.title,
        department: app.jobPosting.department
      },
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
