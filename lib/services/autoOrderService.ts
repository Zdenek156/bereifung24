import { prisma } from '@/lib/prisma'
import { placeOrder } from './tyreSystemService'

/**
 * Auto-Order Service
 * Automatically orders tires from TyreSystem when a booking is created
 * Only triggers if workshop has autoOrder=true for their supplier
 */

export async function autoOrderTires(
  bookingId: string
): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
  try {
    // Get booking with all details including workshop address
    const booking = await prisma.directBooking.findUnique({
      where: { id: bookingId },
      include: {
        workshop: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                street: true,
                city: true,
                zipCode: true,
              }
            }
          }
        },
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
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

    // Only process tire services
    const tireServices = ['TIRE_CHANGE', 'TIRE_MOUNT', 'MOTORCYCLE_TIRE']
    if (!tireServices.includes(booking.serviceType)) {
      console.log(`⏭️ [Auto-Order] Skipped: Service type ${booking.serviceType} does not require tire ordering`)
      return { success: false, error: 'Not a tire service' }
    }

    // Check if workshop has TyreSystem configured for auto-order
    const supplier = await prisma.workshopSupplier.findFirst({
      where: {
        workshopId: booking.workshop.id,
        supplier: 'TYRESYSTEM',
        isActive: true,
        autoOrder: true,
        connectionType: 'API', // Auto-order only works with API connection
      }
    })

    if (!supplier) {
      console.log(`⏭️ [Auto-Order] Skipped: TyreSystem auto-order not enabled for ${booking.workshop.companyName}`)
      return { success: false, error: 'Auto-order not enabled' }
    }

    // Build order items from tireData (supports both standard and mixed tires)
    const tireData = booking.tireData as any
    const orderItems: any[] = []

    if (tireData?.isMixedTires && tireData.front && tireData.rear) {
      // Mixed tires (e.g. motorcycle front/rear)
      if (tireData.front.articleId) {
        orderItems.push({
          pos: 1,
          idArticle: tireData.front.articleId,
          ean: tireData.front.ean || '',
          guid: null,
          amount: tireData.front.quantity || 1,
          price: tireData.front.supplierPrice || tireData.front.purchasePrice || 0,
        })
      }
      if (tireData.rear.articleId) {
        orderItems.push({
          pos: 2,
          idArticle: tireData.rear.articleId,
          ean: tireData.rear.ean || '',
          guid: null,
          amount: tireData.rear.quantity || 1,
          price: tireData.rear.supplierPrice || tireData.rear.purchasePrice || 0,
        })
      }
    } else if (booking.tireArticleId) {
      // Standard single tire type
      orderItems.push({
        pos: 1,
        idArticle: booking.tireArticleId,
        ean: booking.tireEAN || '',
        guid: null,
        amount: booking.tireQuantity || 4,
        price: booking.tirePurchasePrice ? Number(booking.tirePurchasePrice) : 0,
      })
    }

    if (orderItems.length === 0) {
      console.log(`⏭️ [Auto-Order] Skipped: No tire article IDs in booking ${bookingId}`)
      await prisma.directBooking.update({
        where: { id: bookingId },
        data: {
          supplierOrderStatus: 'ERROR',
          supplierOrderError: 'Keine Artikel-IDs für Bestellung vorhanden',
        }
      })
      return { success: false, error: 'No tire article IDs in booking' }
    }

    // Build order - delivery to WORKSHOP address (not customer!)
    const workshopUser = booking.workshop.user
    const orderData = {
      order: {
        items: {
          item: orderItems
        },
        delivery_address: {
          neutraldelivery: 0, // Normal delivery to workshop
          salutation: 'Firma',
          name: booking.workshop.companyName,
          street: workshopUser?.street || '',
          zipcode: workshopUser?.zipCode || '',
          city: workshopUser?.city || '',
          countrycode: 'DE',
        },
        ordernumber_customer: `B24-${booking.id.substring(0, 8).toUpperCase()}`,
        commission: `Bereifung24 Buchung - Kunde: ${booking.customer?.user?.firstName || ''} ${booking.customer?.user?.lastName || ''}`.trim(),
      }
    }

    console.log(`📦 [Auto-Order] Placing TyreSystem order for booking ${bookingId}`)
    console.log(`   Workshop: ${booking.workshop.companyName}`)
    console.log(`   Items: ${orderItems.length}`)
    console.log(`   Delivery to: ${workshopUser?.street}, ${workshopUser?.zipCode} ${workshopUser?.city}`)

    // Place order via TyreSystem API
    const response = await placeOrder(booking.workshop.id, orderData)

    if (!response) {
      await prisma.directBooking.update({
        where: { id: bookingId },
        data: {
          supplierOrderStatus: 'ERROR',
          supplierOrderError: 'TyreSystem API-Anfrage fehlgeschlagen (keine Antwort)',
        }
      })
      return { success: false, error: 'TyreSystem API returned no response - check server logs for details' }
    }

    // Check for errors in positions
    const hasErrors = response.orderResponse.positions.position.some(
      pos => pos.error !== 0 || !pos.orderStatus
    )

    if (hasErrors) {
      const errorMessages = response.orderResponse.positions.position
        .filter(pos => pos.error !== 0)
        .map(pos => `Pos ${pos.pos}: ${pos.errorMessage || 'Unbekannter Fehler'}`)
        .join('; ')
      
      const partialOrderNumbers = response.orderResponse.positions.position
        .filter(pos => pos.ordernumber)
        .map(pos => pos.ordernumber)
        .join(', ')

      await prisma.directBooking.update({
        where: { id: bookingId },
        data: {
          supplierOrderNumber: partialOrderNumbers || null,
          supplierOrderedAt: new Date(),
          supplierOrderStatus: 'ERROR',
          supplierOrderError: errorMessages,
        }
      })

      console.error(`⚠️ [Auto-Order] Order completed with errors: ${errorMessages}`)
      return { success: false, orderNumber: partialOrderNumbers, error: errorMessages }
    }

    // Success - get all order numbers
    const orderNumbers = response.orderResponse.positions.position
      .map(pos => pos.ordernumber)
      .join(', ')

    // Update booking with success
    await prisma.directBooking.update({
      where: { id: bookingId },
      data: {
        supplierOrderNumber: orderNumbers,
        supplierOrderedAt: new Date(),
        supplierOrderStatus: 'ORDERED',
        supplierOrderError: null,
      }
    })

    console.log(`✅ [Auto-Order] Success! TyreSystem Order: ${orderNumbers}`)

    return {
      success: true,
      orderNumber: orderNumbers
    }

  } catch (error) {
    console.error(`❌ [Auto-Order] Failed for booking ${bookingId}:`, error)
    
    try {
      await prisma.directBooking.update({
        where: { id: bookingId },
        data: {
          supplierOrderStatus: 'ERROR',
          supplierOrderError: error instanceof Error ? error.message : 'Unbekannter Fehler',
        }
      })
    } catch (updateError) {
      console.error(`❌ [Auto-Order] Could not update booking with error:`, updateError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
