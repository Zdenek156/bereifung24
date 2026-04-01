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

    const texts: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, key, title, content, version, target,
             created_at as "createdAt",
             updated_at as "updatedAt",
             last_updated_by as "lastUpdatedBy"
      FROM legal_texts
      ORDER BY key ASC, target ASC
    `)

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
    const { key, title, content, target } = body

    if (!key || !title || content === undefined || !target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validKeys = ['agb', 'impressum', 'datenschutz']
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const validTargets = ['web', 'app']
    if (!validTargets.includes(target)) {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
    }

    // Check if row exists
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, version FROM legal_texts WHERE key = $1 AND target = $2 LIMIT 1`,
      key, target
    )

    let result: any[]

    if (existing.length > 0) {
      // Update
      result = await prisma.$queryRawUnsafe(`
        UPDATE legal_texts
        SET title = $1, content = $2, version = $3,
            last_updated_by = $4, updated_at = NOW()
        WHERE key = $5 AND target = $6
        RETURNING id, key, title, content, version, target,
                  created_at as "createdAt",
                  updated_at as "updatedAt",
                  last_updated_by as "lastUpdatedBy"
      `, title, content, existing[0].version + 1, session.user.id, key, target)
    } else {
      // Insert
      result = await prisma.$queryRawUnsafe(`
        INSERT INTO legal_texts (id, key, title, content, version, target, last_updated_by, created_at, updated_at)
        VALUES (gen_random_uuid()::text, $1, $2, $3, 1, $4, $5, NOW(), NOW())
        RETURNING id, key, title, content, version, target,
                  created_at as "createdAt",
                  updated_at as "updatedAt",
                  last_updated_by as "lastUpdatedBy"
      `, key, title, content, target, session.user.id)
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error saving legal text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
