import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { generatePostContent } from '@/lib/social-media/contentGeneratorService'

// POST /api/admin/social-media/generate-text
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const { postType, workshopName, city, services, rating, blogTitle, blogExcerpt, platform, customPrompt } = body

    if (!postType) {
      return NextResponse.json({ error: 'postType is required' }, { status: 400 })
    }

    const result = await generatePostContent({
      postType,
      workshopName,
      city,
      services,
      rating,
      blogTitle,
      blogExcerpt,
      platform,
      customPrompt
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    )
  }
}
