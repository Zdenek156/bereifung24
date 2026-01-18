import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}

    if (from || to) {
      where.bookingDate = {}
      if (from) where.bookingDate.gte = new Date(from)
      if (to) where.bookingDate.lte = new Date(to)
    }

    const entries = await prisma.accountingEntry.findMany({
      where,
      orderBy: {
        bookingDate: 'asc'
      }
    })

    // Fetch account details
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

    // Generate CSV
    const headers = [
      'Belegnummer',
      'Buchungsdatum',
      'Soll-Konto',
      'Soll-Kontoname',
      'Haben-Konto',
      'Haben-Kontoname',
      'Betrag',
      'Beschreibung',
      'Quelle',
      'Status'
    ]

    const rows = entries.map(entry => [
      entry.entryNumber,
      new Date(entry.bookingDate).toLocaleDateString('de-DE'),
      entry.debitAccount,
      accountMap.get(entry.debitAccount) || '',
      entry.creditAccount,
      accountMap.get(entry.creditAccount) || '',
      entry.amount.toNumber().toFixed(2),
      `"${entry.description.replace(/"/g, '""')}"`,
      entry.sourceType,
      entry.isStorno ? 'STORNO' : entry.locked ? 'Gesperrt' : 'Offen'
    ])

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Return CSV with UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF'
    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="journal-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
