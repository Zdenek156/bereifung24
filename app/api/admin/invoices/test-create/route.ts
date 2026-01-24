import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createInvoice, generateInvoiceNumber } from '@/lib/invoicing/invoiceService'

/**
 * TEST: Only create invoice in database, no PDF/accounting/SEPA
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    
    const periodStart = new Date(targetYear, targetMonth - 1, 1)
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59)

    console.log(`📅 Testing invoice creation for period: ${periodStart.toLocaleDateString('de-DE')} - ${periodEnd.toLocaleDateString('de-DE')}`)

    // Get first workshop with pending commissions
    const workshop = await prisma.workshop.findFirst({
      where: {
        commissions: {
          some: {
            status: 'PENDING',
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        },
        commissions: {
          where: {
            status: 'PENDING',
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ 
        success: false, 
        error: 'No workshop with pending commissions found' 
      })
    }

    console.log(`🏪 Testing with workshop: ${workshop.companyName}`)
    console.log(`📊 Commissions: ${workshop.commissions.length}`)

    // Calculate simple line items
    const lineItems = workshop.commissions.map(c => ({
      description: `Provision für Auftrag`,
      quantity: 1,
      unitPrice: parseFloat(c.commissionAmount.toString()),
      total: parseFloat(c.commissionAmount.toString())
    }))

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)

    console.log(`💰 Total: ${subtotal.toFixed(2)} EUR`)

    // Create invoice
    const invoice = await createInvoice({
      workshopId: workshop.id,
      periodStart,
      periodEnd,
      lineItems,
      commissionIds: workshop.commissions.map(c => c.id),
      createdBy: 'TEST',
      notes: `TEST - ${new Date().toLocaleString('de-DE')}`
    })

    console.log(`✅ Invoice created: ${invoice.invoiceNumber}`)

    return NextResponse.json({ 
      success: true, 
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        workshopName: workshop.companyName,
        totalAmount: invoice.totalAmount,
        commissionCount: workshop.commissions.length
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
