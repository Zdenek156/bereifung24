import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSalesUser } from '@/lib/sales-auth'
import { crawlProspectWebsite } from '@/lib/sales/websiteCrawler'
import { analyzeProspect } from '@/lib/sales/aiAnalysis'

// POST: Crawlt die Webseite des Prospects + lässt Gemini analysieren
// Speichert das Ergebnis als ProspectWorkshop.aiInsights / websiteRawText / websiteAnalyzedAt
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSalesUser()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const prospect = await prisma.prospectWorkshop.findUnique({
    where: { googlePlaceId: params.id },
  })
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

  // Crawl (nur wenn Webseite vorhanden)
  let crawl = null
  if (prospect.website) {
    try {
      crawl = await crawlProspectWebsite(prospect.website)
    } catch (e: any) {
      crawl = null
    }
  }

  const insights = await analyzeProspect({
    name: prospect.name,
    city: prospect.city,
    postalCode: prospect.postalCode,
    website: prospect.website,
    phone: prospect.phone,
    email: prospect.email,
    rating: prospect.rating,
    reviewCount: prospect.reviewCount,
    placeTypes: prospect.placeTypes,
    crawl,
  })

  // Auto-suggest email aus Crawl, falls noch keine vorhanden
  const dataUpdate: any = {
    aiInsights: insights as any,
    websiteAnalyzedAt: new Date(),
    websiteRawText: crawl?.combinedText?.slice(0, 8000) || null,
  }
  if (!prospect.email && crawl?.emails?.length) {
    dataUpdate.email = crawl.emails[0]
  }

  await prisma.prospectWorkshop.update({
    where: { id: prospect.id },
    data: dataUpdate,
  })

  return NextResponse.json({
    success: true,
    insights,
    crawl: crawl
      ? {
          pages: crawl.pages,
          emails: crawl.emails,
          phones: crawl.phones,
          chars: crawl.combinedText.length,
          errors: crawl.errors,
        }
      : null,
    suggestedEmail: !prospect.email ? crawl?.emails?.[0] || null : null,
  })
}
