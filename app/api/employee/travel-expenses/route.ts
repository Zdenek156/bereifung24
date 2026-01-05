import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/employee/travel-expenses - Liste der eigenen Reisekosten
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email! },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const travelExpenses = await prisma.travelExpense.findMany({
      where: {
        employeeId: employee.id,
        ...(status && { status: status as any }),
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
        startDate: 'desc',
      },
    })

    const stats = {
      total: travelExpenses.length,
      pending: travelExpenses.filter((e) => e.status === 'PENDING').length,
      approved: travelExpenses.filter((e) => e.status === 'APPROVED').length,
      totalAmount: travelExpenses
        .filter((e) => e.status !== 'REJECTED')
        .reduce((sum, e) => sum + Number(e.totalAmount), 0),
    }

    return NextResponse.json({ travelExpenses, stats })
  } catch (error) {
    console.error('Error fetching travel expenses:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Reisekosten' },
      { status: 500 }
    )
  }
}

// POST /api/employee/travel-expenses - Neue Reisekostenabrechnung
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email! },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const {
      purpose,
      startDate,
      endDate,
      destination,
      fullDays,
      partialDays,
      dailyRate,
      mealDeduction,
      accommodationCosts,
      accommodationReceipts,
      travelCosts,
      travelMethod,
      travelReceipts,
      kmDriven,
      kmRate,
      otherCosts,
      otherDescription,
      otherReceipts,
      notes,
    } = body

    // Validierung
    if (!purpose || !startDate || !endDate || !destination) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen' },
        { status: 400 }
      )
    }

    // Gesamtbetrag berechnen
    const verpflegung = 
      (parseFloat(fullDays || 0) * parseFloat(dailyRate || 28)) +
      (parseFloat(partialDays || 0) * parseFloat(dailyRate || 28) * 0.5) -
      parseFloat(mealDeduction || 0)

    const fahrtkosten = kmDriven && kmRate
      ? parseFloat(kmDriven) * parseFloat(kmRate)
      : parseFloat(travelCosts || 0)

    const totalAmount =
      verpflegung +
      parseFloat(accommodationCosts || 0) +
      fahrtkosten +
      parseFloat(otherCosts || 0)

    const travelExpense = await prisma.travelExpense.create({
      data: {
        employeeId: employee.id,
        purpose,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        destination,
        fullDays: parseInt(fullDays || 0),
        partialDays: parseInt(partialDays || 0),
        dailyRate: parseFloat(dailyRate || 28),
        mealDeduction: parseFloat(mealDeduction || 0),
        accommodationCosts: parseFloat(accommodationCosts || 0),
        accommodationReceipts: accommodationReceipts || null,
        travelCosts: parseFloat(travelCosts || 0),
        travelMethod: travelMethod || null,
        travelReceipts: travelReceipts || null,
        kmDriven: kmDriven ? parseInt(kmDriven) : null,
        kmRate: kmRate ? parseFloat(kmRate) : 0.30,
        otherCosts: parseFloat(otherCosts || 0),
        otherDescription: otherDescription || null,
        otherReceipts: otherReceipts || null,
        totalAmount,
        notes: notes || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      travelExpense,
      message: 'Reisekostenabrechnung erfolgreich eingereicht',
    })
  } catch (error) {
    console.error('Error creating travel expense:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Reisekostenabrechnung' },
      { status: 500 }
    )
  }
}
