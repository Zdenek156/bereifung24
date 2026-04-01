import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import * as socialMediaService from '@/lib/social-media/socialMediaService'

// GET /api/admin/social-media/automations
export async function GET() {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const automations = await socialMediaService.getAutomations()
    return NextResponse.json(automations)
  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 })
  }
}

// POST /api/admin/social-media/automations
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, description, trigger, templateId, platforms, autoPublish } = body

    if (!name || !trigger || !templateId) {
      return NextResponse.json(
        { error: 'name, trigger and templateId are required' },
        { status: 400 }
      )
    }

    const automation = await socialMediaService.createAutomation({
      name,
      description,
      trigger,
      templateId,
      platforms,
      autoPublish
    })

    return NextResponse.json(automation, { status: 201 })
  } catch (error) {
    console.error('Error creating automation:', error)
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
  }
}
