import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createInvoice, generateInvoiceNumber } from '@/lib/invoicing/invoiceService'

/**
 * TEST: Only create invoice in database, no PDF/accounting
 * Now uses DirectBookings instead of old Commission records
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    
    const periodStart = new Date(targetYear, targetMonth - 1, 1)
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59)

    console.log(`📅 Testing invoice creation for period: ${periodStart.toLocaleDateString('de-DE')} - ${periodEnd.toLocaleDateString('de-DE')}`)

    // Try to find workshop with paid DirectBookings that haven't been billed yet
    let workshop = await prisma.workshop.findFirst({
      where: {
        directBookings: {
          some: {
            paymentStatus: 'PAID',
            commissionBilledAt: null,
            paidAt: {
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
        directBookings: {
          where: {
            paymentStatus: 'PAID',
            commissionBilledAt: null,
            paidAt: {
              gte: periodStart,
              lte: periodEnd
            }
          },
          include: {
            vehicle: true,
            customer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    // If no unbilled bookings in current period, try any period
    if (!workshop || workshop.directBookings.length === 0) {
      console.log('⚠️ No unbilled DirectBookings in current period, searching all periods...')
      workshop = await prisma.workshop.findFirst({
        where: {
          directBookings: {
            some: {
              paymentStatus: 'PAID',
              commissionBilledAt: null
            }
          }
        },
        include: {
          user: {
            select: {
              email: true
            }
          },
          directBookings: {
            where: {
              paymentStatus: 'PAID',
              commissionBilledAt: null
            },
            take: 5, // Limit to 5 for testing
            include: {
              vehicle: true,
              customer: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })
    }

    // If still none found, create a test DirectBooking
    if (!workshop || workshop.directBookings.length === 0) {
      console.log('⚠️ No unbilled DirectBookings found, creating test data...')
      
      // Find any workshop with a vehicle
      const anyWorkshop = await prisma.workshop.findFirst({
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      })

      if (!anyWorkshop) {
        return NextResponse.json({ 
          success: false, 
          error: 'No workshop found in database. Please create a workshop first.' 
        }, { status: 400 })
      }

      // Find any customer with a vehicle
      const anyCustomer = await prisma.customer.findFirst({
        include: {
          vehicles: true
        }
      })

      if (!anyCustomer || anyCustomer.vehicles.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No customer with vehicle found. Please create test data first.' 
        }, { status: 400 })
      }

      // Create a test DirectBooking
      const testBooking = await prisma.directBooking.create({
        data: {
          workshopId: anyWorkshop.id,
          customerId: anyCustomer.id,
          vehicleId: anyCustomer.vehicles[0].id,
          serviceType: 'WHEEL_CHANGE',
          date: new Date(),
          time: '10:00',
          basePrice: 50.00,
          totalPrice: 50.00,
          platformCommission: 3.45, // 6.9% of 50€
          platformCommissionCents: 345,
          workshopPayout: 46.55,
          durationMinutes: 60,
          status: 'CONFIRMED',
          paymentMethod: 'STRIPE',
          paymentStatus: 'PAID',
          paidAt: new Date(),
          stripeSessionId: 'test-session-' + Date.now(),
          stripePaymentId: 'test-payment-' + Date.now()
        }
      })

      workshop = await prisma.workshop.findUnique({
        where: { id: anyWorkshop.id },
        include: {
          user: {
            select: {
              email: true
            }
          },
          directBookings: {
            where: { id: testBooking.id },
            include: {
              vehicle: true,
              customer: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })

      console.log(`✅ Created test DirectBooking for workshop: ${anyWorkshop.companyName}`)
    }

    if (!workshop) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to find or create test data' 
      }, { status: 500 })
    }

    console.log(`🏪 Testing with workshop: ${workshop.companyName}`)
    console.log(`📊 DirectBookings: ${workshop.directBookings.length}`)

    // Calculate line items from DirectBookings
    const lineItems = workshop.directBookings.map((booking, index) => {
      const amount = booking.platformCommission ? parseFloat(booking.platformCommission.toString()) : 0
      const serviceLabels: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel',
        'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_MOUNT': 'Reifenmontage'
      }
      const serviceName = serviceLabels[booking.serviceType] || booking.serviceType
      
      return {
        position: index + 1,
        description: serviceName,
        quantity: 1,
        unitPrice: amount,
        total: amount,
        vatRate: 19,
        date: booking.paidAt || booking.createdAt
      }
    })

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)

    console.log(`💰 Total: ${subtotal.toFixed(2)} EUR`)

    // Create invoice
    const invoice = await createInvoice({
      workshopId: workshop.id,
      periodStart,
      periodEnd,
      lineItems,
      commissionIds: [], // No commission IDs for DirectBookings
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
        bookingCount: workshop.directBookings.length
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
