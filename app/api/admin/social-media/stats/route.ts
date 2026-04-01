import { NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { getDashboardStats } from '@/lib/social-media/socialMediaService'

// GET /api/admin/social-media/stats
export async function GET() {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching social media stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
