import { NextRequest, NextResponse } from 'next/server'
import { getAvailableBrands } from '@/lib/services/tireSearchService'

/**
 * GET /api/workshop/tires/brands?workshopId=xxx&width=xxx&height=xxx&diameter=xxx
 * Get available tire brands for filter dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workshopId = searchParams.get('workshopId')
    const width = searchParams.get('width') || undefined
    const height = searchParams.get('height') || undefined
    const diameter = searchParams.get('diameter') || undefined

    if (!workshopId) {
      return NextResponse.json(
        { success: false, error: 'workshopId erforderlich' },
        { status: 400 }
      )
    }

    const brands = await getAvailableBrands(workshopId, width, height, diameter)

    return NextResponse.json({
      success: true,
      brands
    })
  } catch (error: any) {
    console.error('[TIRE-BRANDS-API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Fehler beim Laden der Marken' },
      { status: 500 }
    )
  }
}
