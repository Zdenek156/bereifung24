import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key.toLowerCase()

    const validKeys = ['agb', 'impressum', 'datenschutz']
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const legal = await prisma.legalText.findUnique({
      where: { key },
      select: {
        key: true,
        title: true,
        content: true,
        version: true,
        updatedAt: true,
      },
    })

    if (!legal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(legal, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching legal text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
