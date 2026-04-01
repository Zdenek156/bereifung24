import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import * as socialMediaService from '@/lib/social-media/socialMediaService'

// GET /api/admin/social-media/templates
export async function GET(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const { searchParams } = new URL(req.url)
    const postType = searchParams.get('postType') as any
    const templates = await socialMediaService.getTemplates(postType || undefined)
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/admin/social-media/templates
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, description, postType, textTemplate, htmlTemplate, platforms } = body

    if (!name || !postType || !textTemplate) {
      return NextResponse.json(
        { error: 'name, postType and textTemplate are required' },
        { status: 400 }
      )
    }

    const template = await socialMediaService.createTemplate({
      name,
      description,
      postType,
      textTemplate,
      htmlTemplate,
      platforms
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
