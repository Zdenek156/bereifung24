import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { generateTrendPosts, type Audience, type Style } from '@/lib/social-media/trendsService'

// POST /api/admin/social-media/trends/generate
// Body: { keywords: string[], audience: 'CUSTOMER'|'WORKSHOP'|'BOTH', style: Style, count: number, platform?: string }
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const keywords: string[] = Array.isArray(body.keywords)
      ? body.keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
      : []

    if (keywords.length === 0) {
      return NextResponse.json({ error: 'Mindestens ein Keyword/Trend erforderlich' }, { status: 400 })
    }

    const audience: Audience = ['CUSTOMER', 'WORKSHOP', 'BOTH'].includes(body.audience) ? body.audience : 'BOTH'
    const style: Style = ['INFORMATIVE', 'FUNNY', 'PROVOCATIVE', 'STORY', 'EMOTIONAL'].includes(body.style) ? body.style : 'INFORMATIVE'
    const count = Math.min(Math.max(parseInt(String(body.count || 3), 10) || 3, 1), 5)
    const platform = typeof body.platform === 'string' ? body.platform : undefined

    const posts = await generateTrendPosts({ keywords, audience, style, count, platform })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error generating trend posts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate posts' },
      { status: 500 }
    )
  }
}
