import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/employee/expenses - Liste der eigenen Spesen
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Mitarbeiter finden
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email! },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    // URL Parameter für Filter
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Spesen abrufen
    const expenses = await prisma.expense.findMany({
      where: {
        employeeId: employee.id,
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        approvedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Statistiken
    const stats = {
      total: expenses.length,
      pending: expenses.filter((e) => e.status === 'PENDING').length,
      approved: expenses.filter((e) => e.status === 'APPROVED').length,
      rejected: expenses.filter((e) => e.status === 'REJECTED').length,
      totalAmount: expenses
        .filter((e) => e.status !== 'REJECTED')
        .reduce((sum, e) => sum + Number(e.amount), 0),
      pendingAmount: expenses
        .filter((e) => e.status === 'PENDING')
        .reduce((sum, e) => sum + Number(e.amount), 0),
    }

    return NextResponse.json({ expenses, stats })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Spesen' },
      { status: 500 }
    )
  }
}

// POST /api/employee/expenses - Neue Spese einreichen
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Mitarbeiter finden
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email! },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const {
      category,
      amount,
      vatAmount,
      vatRate,
      date,
      description,
      merchant,
      receiptUrl,
      projectName,
      customerName,
    } = body

    // Validierung
    if (!category || !amount || !date || !description) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen: category, amount, date, description' },
        { status: 400 }
      )
    }

    // Spese erstellen
    const expense = await prisma.expense.create({
      data: {
        employeeId: employee.id,
        category,
        amount: parseFloat(amount),
        vatAmount: vatAmount ? parseFloat(vatAmount) : null,
        vatRate: vatRate ? parseInt(vatRate) : null,
        date: new Date(date),
        description,
        merchant: merchant || null,
        receiptUrl: receiptUrl || null,
        projectName: projectName || null,
        customerName: customerName || null,
        status: 'PENDING',
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // TODO: E-Mail-Benachrichtigung an Vorgesetzte/HR

    return NextResponse.json({ 
      expense,
      message: 'Spese erfolgreich eingereicht' 
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Spese' },
      { status: 500 }
    )
  }
}
