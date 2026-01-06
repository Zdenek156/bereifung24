import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bookingService } from '@/lib/accounting/bookingService'

// POST /api/admin/expenses/[id]/pay - Mark expense as paid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentDate } = body

    const expense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Expense must be approved before payment' },
        { status: 400 }
      )
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paidAt: paymentDate ? new Date(paymentDate) : new Date()
      }
    })

    // AUTO-BOOKING: Create payment entry (clear liability)
    try {
      await bookingService.bookExpensePaid(
        expense.id,
        expense.amount.toNumber(),
        paymentDate ? new Date(paymentDate) : new Date(),
        session.user.id
      )
      console.log(`✅ Auto-booking created for expense payment ${expense.id}`)
    } catch (error) {
      console.error('Failed to create auto-booking for expense payment:', error)
      // Don't fail the payment if booking fails
    }

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    console.error('Error marking expense as paid:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
