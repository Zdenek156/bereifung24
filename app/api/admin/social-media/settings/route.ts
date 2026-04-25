import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

const KEYS = {
  defaultMockup: 'SOCIAL_MEDIA_DEFAULT_MOCKUP_URL',
  favoriteKeywords: 'SOCIAL_MEDIA_FAVORITE_KEYWORDS', // JSON array
} as const

// GET /api/admin/social-media/settings
export async function GET() {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const rows = await prisma.adminApiSetting.findMany({
    where: { key: { in: Object.values(KEYS) } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value || ''

  let favoriteKeywords: string[] = []
  try {
    const raw = map[KEYS.favoriteKeywords]
    if (raw) favoriteKeywords = JSON.parse(raw)
  } catch {
    favoriteKeywords = []
  }

  return NextResponse.json({
    defaultMockupUrl: map[KEYS.defaultMockup] || '',
    favoriteKeywords,
  })
}

// PUT /api/admin/social-media/settings
// Body: { defaultMockupUrl?: string, favoriteKeywords?: string[] }
export async function PUT(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const writes: Promise<unknown>[] = []

    if (typeof body.defaultMockupUrl === 'string') {
      writes.push(
        prisma.adminApiSetting.upsert({
          where: { key: KEYS.defaultMockup },
          create: { key: KEYS.defaultMockup, value: body.defaultMockupUrl, description: 'Standard-Mockup für Social-Media-Posts' },
          update: { value: body.defaultMockupUrl },
        })
      )
    }

    if (Array.isArray(body.favoriteKeywords)) {
      const cleaned = body.favoriteKeywords
        .map((k: unknown) => String(k).trim())
        .filter((k: string) => k.length > 0)
        .slice(0, 50)
      writes.push(
        prisma.adminApiSetting.upsert({
          where: { key: KEYS.favoriteKeywords },
          create: { key: KEYS.favoriteKeywords, value: JSON.stringify(cleaned), description: 'Favoriten-Keywords für Trend-Generator' },
          update: { value: JSON.stringify(cleaned) },
        })
      )
    }

    await Promise.all(writes)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving social-media settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    )
  }
}
