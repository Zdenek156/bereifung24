import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API - Get active job postings
 * No authentication required - accessible to all visitors
 */
export async function GET(request: NextRequest) {
  try {
    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        isActive: true,
        isPublic: true,
        publishedAt: {
          not: null
        }
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
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    // Transform for frontend
    const transformed = jobPostings.map(job => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.position,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits || [],
      employmentType: job.workTimeModel,
      weeklyHours: job.weeklyHours,
      salaryRange: job.salaryMin && job.salaryMax 
        ? { min: job.salaryMin, max: job.salaryMax }
        : null,
      remoteAllowed: job.remoteAllowed,
      applicationDeadline: job.applicationDeadline,
      publishedAt: job.publishedAt,
      applicationCount: job._count.applications
    }))

    return NextResponse.json({
      success: true,
      data: transformed,
      count: transformed.length
    })
  } catch (error) {
    console.error('Error fetching public job postings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    )
  }
}
