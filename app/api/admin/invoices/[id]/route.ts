import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/invoices/[id]
 * Get single invoice with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                email: true,
                street: true,
                zipCode: true,
                city: true
              }
            }
          }
        },
        accountingEntry: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}
