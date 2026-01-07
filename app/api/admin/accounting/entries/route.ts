import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}

    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (from || to) {
      where.bookingDate = {}
      if (from) where.bookingDate.gte = new Date(from)
      if (to) where.bookingDate.lte = new Date(to)
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      orderBy: {
        bookingDate: 'desc'
      },
      take: 100
    })

    // Fetch account details separately
    const accountNumbers = [
      ...new Set([
        ...entries.map(e => e.debitAccount),
        ...entries.map(e => e.creditAccount)
      ])
    ]

    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        accountNumber: { in: accountNumbers }
      },
      select: {
        accountNumber: true,
        accountName: true
      }
    })

    const accountMap = new Map(
      accounts.map(a => [a.accountNumber, a.accountName])
    )

    const serializedEntries = entries.map(entry => ({
      ...entry,
      amount: entry.amount.toNumber(),
      bookingDate: entry.bookingDate.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      debitAccountName: accountMap.get(entry.debitAccount),
      creditAccountName: accountMap.get(entry.creditAccount)
    }))

    return NextResponse.json({ entries: serializedEntries })
  } catch (error) {
    console.error('Error fetching accounting entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
