import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import * as socialMediaService from '@/lib/social-media/socialMediaService'
import { SocialMediaPostStatus, SocialMediaPostType } from '@prisma/client'

// GET /api/admin/social-media/posts — List posts
export async function GET(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as SocialMediaPostStatus | null
    const postType = searchParams.get('postType') as SocialMediaPostType | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await socialMediaService.getPosts({
      status: status || undefined,
      postType: postType || undefined,
      page,
      limit
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/admin/social-media/posts — Create post
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const { title, content, hashtags, imageUrl, videoUrl, postType, scheduledAt, templateId, accountIds } = body

    if (!content || !postType || !accountIds?.length) {
      return NextResponse.json(
        { error: 'content, postType and accountIds are required' },
        { status: 400 }
      )
    }

    const post = await socialMediaService.createPost({
      title,
      content,
      hashtags,
      imageUrl,
      videoUrl,
      postType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      templateId,
      accountIds
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
