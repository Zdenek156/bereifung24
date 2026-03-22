import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const ratingFilter = searchParams.get('rating')

    const where = ratingFilter ? { rating: parseInt(ratingFilter) } : {}

    const [feedbacks, total, stats] = await Promise.all([
      prisma.appFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appFeedback.count({ where }),
      prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as total,
          ROUND(AVG(rating)::numeric, 1) as average,
          COUNT(*) FILTER (WHERE rating = 1)::int as r1,
          COUNT(*) FILTER (WHERE rating = 2)::int as r2,
          COUNT(*) FILTER (WHERE rating = 3)::int as r3,
          COUNT(*) FILTER (WHERE rating = 4)::int as r4,
          COUNT(*) FILTER (WHERE rating = 5)::int as r5
        FROM app_feedback
      `,
    ])

    // Get user info for each feedback
    const userIds = [...new Set(feedbacks.map((f: { userId: string }) => f.userId))]
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    }) : []
    const userMap = new Map(users.map((u: { id: string }) => [u.id, u]))

    const enriched = feedbacks.map((f: { userId: string }) => ({
      ...f,
      user: userMap.get(f.userId) || null,
    }))

    const rawStats = (stats as Record<string, unknown>[])[0] || {}

    return NextResponse.json({
      feedbacks: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        total: Number(rawStats.total) || 0,
        average: Number(rawStats.average) || 0,
        distribution: {
          1: Number(rawStats.r1) || 0,
          2: Number(rawStats.r2) || 0,
          3: Number(rawStats.r3) || 0,
          4: Number(rawStats.r4) || 0,
          5: Number(rawStats.r5) || 0,
        },
      },
    })
  } catch (error) {
    console.error('[FEEDBACK ADMIN API] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden' },
      { status: 500 }
    )
  }
}
