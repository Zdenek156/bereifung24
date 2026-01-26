import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET - List job postings
export async function GET(request: NextRequest) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const jobPostings = await prisma.jobPosting.findMany({
      where,
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform to match frontend interface
    const transformed = jobPostings.map(job => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.position, // Using position as location
      employmentType: job.workTimeModel,
      salaryRange: job.salaryMin && job.salaryMax 
        ? `${job.salaryMin} - ${job.salaryMax} €` 
        : null,
      description: job.description,
      requirements: job.requirements.join('\n'),
      benefits: job.benefits?.join('\n') || null,
      isActive: job.isActive,
      applicationCount: job._count.applications,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching job postings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job postings' },
      { status: 500 }
    )
  }
}

// POST - Create job posting
export async function POST(request: NextRequest) {
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

    const data = await request.json()

    // Parse requirements and benefits from textarea
    const requirements = data.requirements
      .split('\n')
      .filter((r: string) => r.trim())
      .map((r: string) => r.trim())

    const benefits = data.benefits
      ? data.benefits.split('\n').filter((b: string) => b.trim()).map((b: string) => b.trim())
      : []

    // Parse salary range if provided
    let salaryMin = null
    let salaryMax = null
    if (data.salaryRange && data.salaryRange.trim()) {
      const parts = data.salaryRange.split('-')
      if (parts.length === 2) {
        salaryMin = parseFloat(parts[0].trim()) || null
        salaryMax = parseFloat(parts[1].trim()) || null
      }
    }

    // Map employmentType to WorkTimeModel enum
    const employmentTypeMap: Record<string, string> = {
      'FULL_TIME': 'FULLTIME_40H',
      'PART_TIME': 'PARTTIME_30H',
      'MINI_JOB': 'MINIJOB_603',
      'MIDI_JOB': 'PARTTIME_20H',
      'INTERN': 'FULLTIME_40H',
      'APPRENTICE': 'FULLTIME_40H',
      'WORKING_STUDENT': 'PARTTIME_20H',
      'FREELANCE': 'FULLTIME_40H',
      'TEMPORARY': 'FULLTIME_40H'
    }

    const workTimeModel = employmentTypeMap[data.employmentType] || 'FULLTIME_40H'
    const weeklyHours = data.employmentType === 'FULL_TIME' ? 40 
      : data.employmentType === 'PART_TIME' ? 30
      : data.employmentType === 'WORKING_STUDENT' ? 20
      : data.employmentType === 'MIDI_JOB' ? 20
      : null

    const jobPosting = await prisma.jobPosting.create({
      data: {
        title: data.title,
        department: data.department,
        position: data.location, // Using location as position
        description: data.description,
        requirements,
        benefits,
        workTimeModel,
        weeklyHours,
        salaryMin,
        salaryMax,
        isActive: data.isActive,
        isPublic: data.isActive,
        publishedAt: data.isActive ? new Date() : null,
        createdById: employee.id
      }
    })

    return NextResponse.json(jobPosting, { status: 201 })
  } catch (error) {
    console.error('Error creating job posting:', error)
    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    )
  }
}
