import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * TEST Route: Step-by-step invoice generation
 * Step 1: Just create invoice record (no PDF, no accounting, no SEPA)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧪 TEST: Starting invoice generation test...')

    // Get December 2025 period
    const periodStart = new Date(2025, 11, 1) // Dec 1, 2025
    const periodEnd = new Date(2025, 11, 31, 23, 59, 59) // Dec 31, 2025

    console.log(`📅 Period: ${periodStart.toLocaleDateString('de-DE')} - ${periodEnd.toLocaleDateString('de-DE')}`)

    // Step 1: Find workshops with PENDING commissions
    console.log('Step 1: Finding workshops...')
    const workshops = await prisma.workshop.findMany({
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
          },
          include: {
            booking: {
              include: {
                offer: true
              }
            }
          }
        }
      }
    })

    console.log(`✅ Found ${workshops.length} workshops`)

    if (workshops.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No workshops with pending commissions found',
        workshops: 0
      })
    }

    // Step 2: Process first workshop only (for testing)
    const workshop = workshops[0]
    console.log(`\n🏪 Testing with: ${workshop.companyName}`)
    console.log(`📧 Email: ${workshop.user.email}`)
    console.log(`💰 Commissions: ${workshop.commissions.length}`)

    // Calculate totals
    const subtotal = workshop.commissions.reduce((sum, c) => {
      return sum + parseFloat(c.commissionAmount.toString())
    }, 0)
    const vatAmount = subtotal * 0.19
    const totalAmount = subtotal + vatAmount

    console.log(`💵 Subtotal: ${subtotal.toFixed(2)} EUR`)
    console.log(`💵 VAT: ${vatAmount.toFixed(2)} EUR`)
    console.log(`💵 Total: ${totalAmount.toFixed(2)} EUR`)

    // Step 3: Create invoice number
    const invoiceNumber = `RE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    console.log(`📄 Invoice Number: ${invoiceNumber}`)

    // Step 4: Create invoice record (minimal - no PDF, no accounting yet)
    console.log('Step 4: Creating invoice record...')
    const invoice = await prisma.commissionInvoice.create({
      data: {
        workshopId: workshop.id,
        invoiceNumber,
        periodStart,
        periodEnd,
        subtotal,
        vatRate: 0.19,
        vatAmount,
        totalAmount,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        commissions: {
          connect: workshop.commissions.map(c => ({ id: c.id }))
        }
      }
    })

    console.log(`✅ Invoice created: ${invoice.id}`)

    return NextResponse.json({
      success: true,
      message: 'Test successful - Invoice created',
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        workshop: {
          id: workshop.id,
          name: workshop.companyName,
          email: workshop.user.email
        },
        commissions: workshop.commissions.length,
        subtotal,
        vatAmount,
        totalAmount
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
