import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API - Get single job posting details
 * No authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        title: true,
        department: true,
        position: true,
        description: true,
        requirements: true,
        benefits: true,
        workTimeModel: true,
        weeklyHours: true,
        salaryMin: true,
        salaryMax: true,
        remoteAllowed: true,
        applicationDeadline: true,
        publishedAt: true,
        isActive: true,
        isPublic: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
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

    // Only return if active and public
    if (!jobPosting.isActive || !jobPosting.isPublic) {
      return NextResponse.json(
        { error: 'Job posting not available' },
        { status: 404 }
      )
    }

    // Transform for frontend
    const transformed = {
      id: jobPosting.id,
      title: jobPosting.title,
      department: jobPosting.department,
      location: jobPosting.position,
      description: jobPosting.description,
      requirements: jobPosting.requirements,
      benefits: jobPosting.benefits || [],
      employmentType: jobPosting.workTimeModel,
      weeklyHours: jobPosting.weeklyHours,
      salaryRange: jobPosting.salaryMin && jobPosting.salaryMax 
        ? { min: jobPosting.salaryMin, max: jobPosting.salaryMax }
        : null,
      remoteAllowed: jobPosting.remoteAllowed,
      applicationDeadline: jobPosting.applicationDeadline,
      publishedAt: jobPosting.publishedAt,
      contactPerson: jobPosting.createdBy 
        ? `${jobPosting.createdBy.firstName} ${jobPosting.createdBy.lastName}`
        : 'HR Team'
    }

    return NextResponse.json({
      success: true,
      data: transformed
    })
  } catch (error) {
    console.error('Error fetching job posting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job posting' },
      { status: 500 }
    )
  }
}
