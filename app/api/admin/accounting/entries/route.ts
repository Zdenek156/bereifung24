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
    const accountFrom = searchParams.get('accountFrom')
    const accountTo = searchParams.get('accountTo')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const sourceType = searchParams.get('sourceType')
    const isStorno = searchParams.get('isStorno')

    const where: any = {}

    if (search) {
      where.OR = [
        { entryNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { debitAccount: { contains: search, mode: 'insensitive' } },
        { creditAccount: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (from || to) {
      where.bookingDate = {}
      if (from) where.bookingDate.gte = new Date(from)
      if (to) where.bookingDate.lte = new Date(to)
    }

    if (accountFrom || accountTo) {
      where.OR = where.OR || []
      const accountConditions = []
      
      if (accountFrom && accountTo) {
        accountConditions.push(
          { debitAccount: { gte: accountFrom, lte: accountTo } },
          { creditAccount: { gte: accountFrom, lte: accountTo } }
        )
      } else if (accountFrom) {
        accountConditions.push(
          { debitAccount: { gte: accountFrom } },
          { creditAccount: { gte: accountFrom } }
        )
      } else if (accountTo) {
        accountConditions.push(
          { debitAccount: { lte: accountTo } },
          { creditAccount: { lte: accountTo } }
        )
      }
      
      if (where.OR.length > 0) {
        where.AND = [{ OR: [...where.OR] }, { OR: accountConditions }]
        delete where.OR
      } else {
        where.OR = accountConditions
      }
    }

    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) where.amount.gte = parseFloat(minAmount)
      if (maxAmount) where.amount.lte = parseFloat(maxAmount)
    }

    if (sourceType && sourceType !== 'ALL') {
      where.sourceType = sourceType
    }

    if (isStorno === 'true') {
      where.isStorno = true
    } else if (isStorno === 'false') {
      where.isStorno = false
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
