import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { publishPost } from '@/lib/social-media/publishingService'

// POST /api/admin/social-media/posts/[id]/publish
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const result = await publishPost(params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Veröffentlichen' },
      { status: 500 }
    )
  }
}
