import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { getSearchConsoleData } from '@/lib/google-search-console'

// GET /api/admin/analytics/search-console
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const filter = searchParams.get('filter') || undefined

    const data = await getSearchConsoleData(timeRange, filter)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching Search Console data:', error)
    
    // Return specific error messages for configuration issues
    if (error.message?.includes('nicht konfiguriert') || error.message?.includes('Ungültiger JSON')) {
      return NextResponse.json(
        { error: error.message, configured: false },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Fehler beim Laden der Search Console Daten', configured: true },
      { status: 500 }
    )
  }
}
