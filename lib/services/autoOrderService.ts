import { prisma } from '@/lib/prisma'
import { placeOrder } from './tyreSystemService'

/**
 * Auto-Order Service
 * Automatically orders tires from TyreSystem when a booking is created
 */

interface TireOrderItem {
  articleNumber: string
  ean: string
  quantity: number
  price: number // Purchase price (EK)
}

export async function autoOrderTires(
  bookingId: string
): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  try {
    // Get booking with all details
    const booking = await prisma.directBooking.findUnique({
      where: { id: bookingId },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            city: true,
          }
        },
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
            street: true,
            city: true,
            zipCode: true,
          }
        },
      }
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    if (!booking.workshop) {
      throw new Error('Workshop not found for booking')
    }

    // Check if workshop has TyreSystem configured for auto-order
    const supplier = await prisma.workshopSupplier.findFirst({
      where: {
        workshopId: booking.workshop.id,
        supplier: 'TYRESYSTEM',
        isActive: true,
        autoOrder: true, // Only auto-order if enabled
      }
    })

    if (!supplier) {
      console.log(`⏭️ [Auto-Order] Skipped: TyreSystem auto-order not enabled for ${booking.workshop.companyName}`)
      return { success: false, error: 'Auto-order not enabled' }
    }

    // Extract tire info from booking
    // CRITICAL: This depends on how tire data is stored in DirectBooking
    const tireArticleNumbers = booking.selectedTires // Assuming this field exists
    
    if (!tireArticleNumbers || tireArticleNumbers.length === 0) {
      console.log(`⏭️ [Auto-Order] Skipped: No tires selected in booking ${bookingId}`)
      return { success: false, error: 'No tires in booking' }
    }

    // Get tire details from inventory
    const tires = await prisma.workshopInventory.findMany({
      where: {
        workshopId: booking.workshop.id,
        articleNumber: { in: tireArticleNumbers },
        supplier: 'TYRESYSTEM'
      }
    })

    if (tires.length === 0) {
      throw new Error('No matching TyreSystem tires found in inventory')
    }

    // Build order items
    const orderItems = tires.map((tire, index) => ({
      pos: index + 1,
      idArticle: parseInt(tire.articleNumber) || tire.articleNumber,
      ean: tire.ean || '',
      guid: null,
      amount: booking.tireQuantity || 4, // Number of tires ordered
      price: tire.price, // Purchase price (EK)
    }))

    // Build order
    const orderData = {
      order: {
        items: {
          item: orderItems
        },
        delivery_address: {
          neutraldelivery: 0, // Normal delivery (not neutral)
          salutation: 'Firma',
          name: booking.workshop.companyName,
          street: booking.user?.street || '',
          zipcode: booking.user?.zipCode || '',
          city: booking.workshop.city,
          countrycode: 'DE',
        },
        ordernumber_customer: `B24-${booking.id}`,
        commission: `Bereifung24 Buchung #${booking.id} - Kunde: ${booking.user?.name || 'Unknown'}`,
      }
    }

    console.log(`📦 [Auto-Order] Placing TyreSystem order for booking ${bookingId}`)
    console.log(`   Workshop: ${booking.workshop.companyName}`)
    console.log(`   Items: ${orderItems.length}`)

    // Place order
    const response = await placeOrder(booking.workshop.id, orderData)

    if (!response) {
      throw new Error('TyreSystem order failed')
    }

    // Check for errors
    const hasErrors = response.orderResponse.positions.position.some(
      pos => pos.error !== 0 || !pos.orderStatus
    )

    if (hasErrors) {
      const errorMessages = response.orderResponse.positions.position
        .filter(pos => pos.error !== 0)
        .map(pos => pos.errorMessage)
        .join(', ')
      
      throw new Error(`TyreSystem order completed with errors: ${errorMessages}`)
    }

    // Get order numbers
    const orderNumbers = response.orderResponse.positions.position
      .map(pos => pos.ordernumber)
      .join(', ')

    // Update booking with order number
    await prisma.directBooking.update({
      where: { id: bookingId },
      data: {
        supplierOrderNumber: orderNumbers,
        supplierOrderedAt: new Date(),
      }
    })

    console.log(`✅ [Auto-Order] Success! TyreSystem Order: ${orderNumbers}`)

    return {
      success: true,
      orderNumber: orderNumbers
    }

  } catch (error) {
    console.error(`❌ [Auto-Order] Failed for booking ${bookingId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Manually trigger order for existing booking
 * (for testing or manual retry)
 */
export async function manualOrderTires(
  bookingId: string,
  userId: string
): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  // Verify user has permission to order for this booking
  const booking = await prisma.directBooking.findUnique({
    where: { id: bookingId },
    include: {
      workshop: {
        include: {
          user: {
            select: { id: true }
          }
        }
      }
    }
  })

  if (!booking) {
    return { success: false, error: 'Booking not found' }
  }

  if (booking.workshop?.user?.id !== userId) {
    return { success: false, error: 'Unauthorized: Not your workshop' }
  }

  return await autoOrderTires(bookingId)
}
