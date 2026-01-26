import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Track blog post views
 * POST /api/blog/views
 */
export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Missing postId' },
        { status: 400 }
      )
    }

    // Verify post exists and is published
    const post = await prisma.blogPost.findUnique({
      where: { id: postId }
    })

    if (!post || post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Post not found or not published' },
        { status: 404 }
      )
    }

    // Get IP address for tracking (anonymized)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create view record
    await prisma.blogView.create({
      data: {
        postId,
        ipAddress: ip.substring(0, 45), // Truncate to DB field length
        userAgent: userAgent.substring(0, 255)
      }
    })

    // Increment views counter on post
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        views: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully'
    })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track view',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
