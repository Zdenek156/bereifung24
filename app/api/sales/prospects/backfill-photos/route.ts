import { NextResponse } from 'next/server'
import { getPlaceDetails, getPhotoUrl } from '@/lib/googlePlaces'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'

/**
 * POST /api/sales/prospects/backfill-photos
 *
 * Lädt fehlende Fotos (und optional weitere Google-Place-Daten)
 * für existierende Prospects nachträglich von Google Places.
 *
 * Body (optional):
 *   { onlyMissing?: boolean (default true), limit?: number (default 50) }
 */
export async function POST(request: Request) {
  try {
    const employee = await getSalesUser()
    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const onlyMissing = body.onlyMissing !== false
    const limit = Math.min(Number(body.limit) || 50, 200)

    const prospects = await prisma.prospectWorkshop.findMany({
      where: onlyMissing
        ? { OR: [{ photoUrls: { isEmpty: true } }, { photoUrls: { equals: [] } }] }
        : undefined,
      select: { id: true, googlePlaceId: true, name: true, photoUrls: true },
      take: limit,
    })

    let updated = 0
    let skipped = 0
    const errors: { id: string; error: string }[] = []

    for (const p of prospects) {
      try {
        const details = await getPlaceDetails(p.googlePlaceId)
        if (!details) {
          skipped++
          continue
        }

        const photoUrls = await Promise.all(
          (details.photos?.slice(0, 5) || []).map((photo: any) =>
            getPhotoUrl(photo.photo_reference)
          )
        )

        if (photoUrls.length === 0) {
          skipped++
          continue
        }

        await prisma.prospectWorkshop.update({
          where: { id: p.id },
          data: {
            photoUrls,
            openingHours: (details.opening_hours as any) ?? undefined,
            placeTypes: details.types ?? undefined,
            priceLevel: details.price_level ?? undefined,
          },
        })
        updated++
      } catch (err: any) {
        errors.push({ id: p.id, error: err?.message || 'unknown' })
      }
    }

    return NextResponse.json({
      success: true,
      processed: prospects.length,
      updated,
      skipped,
      errors,
    })
  } catch (error: any) {
    console.error('Backfill error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
