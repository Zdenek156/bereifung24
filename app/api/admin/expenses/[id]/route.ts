import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bookingService } from '@/lib/accounting/bookingService'

// PATCH /api/admin/expenses/[id] - Approve or reject expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notes } = body // action: 'approve' or 'reject'

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (expense.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Expense already processed' },
        { status: 400 }
      )
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedById: action === 'approve' ? session.user.id : undefined,
        approvedAt: action === 'approve' ? new Date() : undefined,
        rejectionReason: action === 'reject' ? notes : undefined
      }
    })

    // AUTO-BOOKING: Create accounting entry when expense is approved
    if (action === 'approve') {
      try {
        await bookingService.bookGeneralExpense(
          expense.id,
          expense.amount.toNumber(),
          expense.date,
          session.user.id,
          `${expense.category}: ${expense.description} (${expense.employee.firstName} ${expense.employee.lastName})`
        )
        console.log(`✅ Auto-booking created for expense ${expense.id}`)
      } catch (error) {
        console.error('Failed to create auto-booking for expense:', error)
        // Don't fail the expense approval if booking fails
      }
    }

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    console.error('Error processing expense:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
