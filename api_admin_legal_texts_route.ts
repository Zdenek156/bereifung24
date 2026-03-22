import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const texts = await prisma.legalText.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(texts)
  } catch (error) {
    console.error('Error fetching legal texts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { key, title, content } = body

    if (!key || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validKeys = ['agb', 'impressum', 'datenschutz']
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const existing = await prisma.legalText.findUnique({ where: { key } })

    const result = await prisma.legalText.upsert({
      where: { key },
      update: {
        title,
        content,
        version: existing ? existing.version + 1 : 1,
        lastUpdatedBy: session.user.id,
        updatedAt: new Date(),
      },
      create: {
        id: key + '_' + Date.now(),
        key,
        title,
        content,
        lastUpdatedBy: session.user.id,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving legal text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
