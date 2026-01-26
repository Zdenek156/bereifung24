import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Public API - Submit job application
 * No authentication required
 * Handles CV upload and creates JobApplication record
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const jobPostingId = formData.get('jobPostingId') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string | null
    const coverLetterText = formData.get('coverLetterText') as string | null
    const cvFile = formData.get('cv') as File | null

    // Validation
    if (!jobPostingId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if job posting exists and is active
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId }
    })

    if (!jobPosting) {
      return NextResponse.json(
        { error: 'Job posting not found' },
        { status: 404 }
      )
    }

    if (!jobPosting.isActive || !jobPosting.isPublic) {
      return NextResponse.json(
        { error: 'Job posting is no longer accepting applications' },
        { status: 400 }
      )
    }

    // Check application deadline
    if (jobPosting.applicationDeadline && new Date() > jobPosting.applicationDeadline) {
      return NextResponse.json(
        { error: 'Application deadline has passed' },
        { status: 400 }
      )
    }

    // Handle CV upload
    let cvUrl = ''
    if (cvFile) {
      const bytes = await cvFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedFileName = cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${sanitizedFileName}`
      const filePath = join(uploadsDir, fileName)

      // Save file
      await writeFile(filePath, buffer)
      cvUrl = `/uploads/applications/${fileName}`
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId,
        firstName,
        lastName,
        email,
        phone,
        coverLetterText,
        cvUrl,
        status: 'NEW'
      },
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true
          }
        }
      }
    })

    // TODO: Send email notification to HR team
    // TODO: Send confirmation email to applicant

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        jobTitle: application.jobPosting.title,
        department: application.jobPosting.department
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
