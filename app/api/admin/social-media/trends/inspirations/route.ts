import { NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { getAllInspirations } from '@/lib/social-media/trendsService'

// GET /api/admin/social-media/trends/inspirations
// Returns saisonale Vorschläge, News-Schlagzeilen und KI-generierte Post-Ideen
export async function GET() {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const data = await getAllInspirations()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching trend inspirations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load inspirations' },
      { status: 500 }
    )
  }
}
