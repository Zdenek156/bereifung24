import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/templates
 * Fetch all booking templates for autocomplete and list
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const templates = await prisma.bookingTemplate.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: [{ useCount: 'desc' }, { name: 'asc' }],
      take: 20, // Limit for autocomplete
    })

    return NextResponse.json({ success: true, templates })
  } catch (error) {
    console.error('Error fetching booking templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/templates
 * Create a new booking template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, debitAccount, creditAccount, amount } = body

    // Validation
    if (!name || !description || !debitAccount || !creditAccount || !amount) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const template = await prisma.bookingTemplate.create({
      data: {
        name,
        description,
        debitAccount,
        creditAccount,
        amount,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error('Error creating booking template:', error)
    return NextResponse.json(
      { error: 'Failed to create booking template' },
      { status: 500 }
    )
  }
}
