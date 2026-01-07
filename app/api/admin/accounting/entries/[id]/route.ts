import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const entry = await prisma.accountingEntry.findUnique({
      where: { id: params.id }
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Fetch account details
    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        accountNumber: { in: [entry.debitAccount, entry.creditAccount] }
      },
      select: {
        accountNumber: true,
        accountName: true,
        accountType: true
      }
    })

    const accountMap = new Map(
      accounts.map(a => [a.accountNumber, a])
    )

    // Fetch audit logs
    const auditLogs = await prisma.accountingAuditLog.findMany({
      where: { entryId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Fetch user who created the entry
    const createdBy = entry.createdById ? await prisma.user.findUnique({
      where: { id: entry.createdById },
      select: {
        name: true,
        email: true
      }
    }) : null

    const serializedEntry = {
      ...entry,
      amount: entry.amount.toNumber(),
      bookingDate: entry.bookingDate.toISOString(),
      documentDate: entry.documentDate?.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      debitAccountDetails: accountMap.get(entry.debitAccount),
      creditAccountDetails: accountMap.get(entry.creditAccount),
      createdBy,
      auditLogs: auditLogs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        changes: typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes
      }))
    }

    return NextResponse.json({ entry: serializedEntry })
  } catch (error) {
    console.error('Error fetching entry details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
