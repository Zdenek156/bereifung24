import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/invoices - Get all invoices for the workshop
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true }
    })

    if (!user?.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    const invoices = await prisma.commissionInvoice.findMany({
      where: {
        workshopId: user.workshop.id,
        status: { not: 'DRAFT' } // Only show sent/paid/overdue invoices
      },
      orderBy: { periodEnd: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        periodStart: true,
        periodEnd: true,
        subtotal: true,
        vatAmount: true,
        totalAmount: true,
        status: true,
        sentAt: true,
        paidAt: true,
        dueDate: true,
        pdfUrl: true,
        createdAt: true,
        lineItems: true
      }
    })

    return NextResponse.json({ invoices })

  } catch (error) {
    console.error('[WORKSHOP INVOICES] Error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rechnungen' },
      { status: 500 }
    )
  }
}
