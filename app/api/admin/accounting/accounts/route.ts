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
    const type = searchParams.get('type')

    const where: any = { isActive: true }

    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { accountName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      where.accountType = type
    }

    const accounts = await prisma.chartOfAccounts.findMany({
      where,
      orderBy: {
        accountNumber: 'asc'
      }
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching chart of accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { accountNumber, accountName, accountType, description } = body

    // Validate required fields
    if (!accountNumber || !accountName || !accountType) {
      return NextResponse.json(
        { error: 'accountNumber, accountName, and accountType are required' },
        { status: 400 }
      )
    }

    // Validate account number format (should be numeric)
    if (!/^\d{4}$/.test(accountNumber)) {
      return NextResponse.json(
        { error: 'Account number must be 4 digits' },
        { status: 400 }
      )
    }

    // Check if account already exists
    const existingAccount = await prisma.chartOfAccounts.findUnique({
      where: { accountNumber }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account number already exists' },
        { status: 409 }
      )
    }

    // Create new account
    const newAccount = await prisma.chartOfAccounts.create({
      data: {
        accountNumber,
        accountName,
        accountType,
        description: description || null,
        isActive: true,
        skrType: 'SKR04'
      }
    })

    return NextResponse.json({ account: newAccount }, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Check if account exists
    const account = await prisma.chartOfAccounts.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Check if account is used in any bookings
    const usedInBookings = await prisma.accountingEntry.count({
      where: {
        OR: [
          { debitAccountId: accountId },
          { creditAccountId: accountId }
        ]
      }
    })

    if (usedInBookings > 0) {
      return NextResponse.json(
        { error: `Konto kann nicht gelöscht werden. Es wird in ${usedInBookings} Buchung(en) verwendet.` },
        { status: 400 }
      )
    }

    // Delete account if not used
    await prisma.chartOfAccounts.delete({
      where: { id: accountId }
    })

    return NextResponse.json({
      message: 'Konto erfolgreich gelöscht'
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
