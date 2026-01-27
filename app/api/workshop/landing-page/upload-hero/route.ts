import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get workshop and landing page
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { landingPage: true }
    })

    if (!workshop || !workshop.landingPage) {
      return NextResponse.json(
        { error: 'Landing page not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'landing-pages')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Delete old hero image if exists
    if (workshop.landingPage.heroImage) {
      const oldImagePath = join(process.cwd(), 'public', workshop.landingPage.heroImage)
      if (existsSync(oldImagePath)) {
        try {
          await unlink(oldImagePath)
        } catch (err) {
          console.error('Error deleting old hero image:', err)
        }
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `hero-${workshop.id}-${timestamp}.${extension}`
    const filepath = join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update database with new image URL
    const imageUrl = `/uploads/landing-pages/${filename}`
    
    const updatedLandingPage = await prisma.workshopLandingPage.update({
      where: { id: workshop.landingPage.id },
      data: { heroImage: imageUrl }
    })

    return NextResponse.json({
      success: true,
      imageUrl,
      landingPage: updatedLandingPage
    })
  } catch (error) {
    console.error('Hero image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
