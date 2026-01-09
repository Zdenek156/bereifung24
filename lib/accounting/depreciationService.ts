import { prisma } from '@/lib/prisma'
import { Depreciation, Asset } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { AccountingBookingService } from './bookingService'

/**
 * Depreciation Service (Abschreibungen - AfA)
 * Manages depreciation calculations and bookings for assets
 * Supports linear, degressive, and immediate depreciation methods
 */

/**
 * Calculate monthly depreciation for a specific asset
 * Linear method: (Acquisition cost / Useful life) / 12 months
 */
export async function calculateMonthlyDepreciation(
  assetId: string,
  year: number,
  month: number
): Promise<Depreciation> {
  try {
    // Get asset details
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        depreciations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!asset) {
      throw new Error('Asset not found')
    }

    if (asset.fullyDepreciated) {
      throw new Error('Asset is already fully depreciated')
    }

    if (asset.status !== 'ACTIVE') {
      throw new Error('Asset is not active')
    }

    // Check if depreciation already exists for this period
    const existing = await prisma.depreciation.findFirst({
      where: {
        assetId,
        year,
        month
      }
    })

    if (existing) {
      return existing
    }

    // Calculate depreciation based on method
    const acquisitionCost = new Decimal(asset.acquisitionCost)
    const usefulLifeMonths = asset.usefulLife * 12
    const depreciationRate = new Decimal(100).div(asset.usefulLife)

    let monthlyDepreciation: Decimal
    let method = asset.afaMethod || 'LINEAR'

    switch (method) {
      case 'LINEAR':
        // Linear: Equal amounts each month
        monthlyDepreciation = acquisitionCost.div(usefulLifeMonths)
        break

      case 'DEGRESSIVE':
        // Degressive: Decreasing amounts (double declining balance)
        const previousDepreciation = asset.depreciations[0]
        const currentBookValue = previousDepreciation 
          ? new Decimal(previousDepreciation.bookValue)
          : acquisitionCost
        
        // Double declining rate
        const decliningRate = depreciationRate.mul(2).div(100)
        monthlyDepreciation = currentBookValue.mul(decliningRate).div(12)
        break

      case 'SOFORT':
        // Immediate: Full depreciation in first year
        monthlyDepreciation = acquisitionCost
        method = 'SOFORT'
        break

      default:
        monthlyDepreciation = acquisitionCost.div(usefulLifeMonths)
    }

    // Get previous accumulated depreciation
    const previousDepreciation = asset.depreciations[0]
    const previousAccumulated = previousDepreciation
      ? new Decimal(previousDepreciation.accumulatedDepreciation)
      : new Decimal(0)

    const accumulatedDepreciation = previousAccumulated.add(monthlyDepreciation)
    const bookValue = acquisitionCost.sub(accumulatedDepreciation)

    // Ensure book value doesn't go below 1 EUR (Erinnerungswert)
    const finalBookValue = bookValue.lessThan(1) ? new Decimal(1) : bookValue
    const finalAccumulated = acquisitionCost.sub(finalBookValue)
    const finalMonthlyDepreciation = finalAccumulated.sub(previousAccumulated)

    // Create depreciation record
    const depreciation = await prisma.depreciation.create({
      data: {
        assetId,
        year,
        month,
        depreciationRate: depreciationRate.toNumber(),
        depreciationAmount: finalMonthlyDepreciation.toNumber(),
        accumulatedDepreciation: finalAccumulated.toNumber(),
        bookValue: finalBookValue.toNumber(),
        method
      }
    })

    // Update asset book value
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        bookValue: finalBookValue.toNumber(),
        fullyDepreciated: finalBookValue.equals(1)
      }
    })

    return depreciation
  } catch (error) {
    console.error('Error calculating monthly depreciation:', error)
    throw new Error(`Failed to calculate depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Schedule depreciation for all 12 months of a year
 * Creates depreciation entries for the entire year
 */
export async function scheduleDepreciation(assetId: string, year?: number): Promise<Depreciation[]> {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      throw new Error('Asset not found')
    }

    const acquisitionYear = asset.acquisitionDate.getFullYear()
    const targetYear = year || new Date().getFullYear()

    if (targetYear < acquisitionYear) {
      throw new Error('Cannot schedule depreciation before acquisition year')
    }

    const depreciations: Depreciation[] = []

    // Determine start month (acquisition month in first year, otherwise January)
    const startMonth = targetYear === acquisitionYear 
      ? asset.acquisitionDate.getMonth() + 1 
      : 1

    for (let month = startMonth; month <= 12; month++) {
      const depreciation = await calculateMonthlyDepreciation(assetId, targetYear, month)
      depreciations.push(depreciation)

      // Stop if asset is fully depreciated
      if (asset.fullyDepreciated) {
        break
      }
    }

    return depreciations
  } catch (error) {
    console.error('Error scheduling depreciation:', error)
    throw new Error(`Failed to schedule depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Book depreciation to accounting
 * Creates accounting entry: Soll 6220 (Abschreibungen) / Haben asset correction account
 */
export async function bookDepreciation(
  depreciationId: string,
  userId: string
): Promise<void> {
  try {
    const depreciation = await prisma.depreciation.findUnique({
      where: { id: depreciationId },
      include: {
        asset: true
      }
    })

    if (!depreciation) {
      throw new Error('Depreciation not found')
    }

    if (depreciation.entryId) {
      throw new Error('Depreciation already booked')
    }

    const asset = depreciation.asset

    // Determine asset correction account based on asset category
    let assetCorrectionAccount = '0288' // Default: Wertberichtigungen Sachanlagen

    // Map asset categories to correction accounts
    if (asset.category === 'INTANGIBLE') {
      assetCorrectionAccount = '0188' // Wertberichtigungen immaterielle Vermögensgegenstände
    } else if (asset.category === 'REAL_ESTATE') {
      assetCorrectionAccount = '0288' // Wertberichtigungen Grundstücke/Gebäude
    } else if (asset.category === 'EQUIPMENT') {
      assetCorrectionAccount = '0288' // Wertberichtigungen Betriebs- und Geschäftsausstattung
    } else if (asset.category === 'VEHICLE') {
      assetCorrectionAccount = '0288' // Wertberichtigungen Fahrzeuge
    }

    // Create accounting entry
    const bookingService = new AccountingBookingService()
    const bookingDate = new Date(depreciation.year, depreciation.month - 1, 1)

    const entry = await bookingService.createBooking({
      debitAccountNumber: '6220', // Abschreibungen auf Sachanlagen
      creditAccountNumber: assetCorrectionAccount,
      amount: depreciation.depreciationAmount,
      description: `AfA ${asset.name} - ${depreciation.month}/${depreciation.year}`,
      bookingDate,
      sourceType: 'MANUAL',
      sourceId: depreciationId,
      createdByUserId: userId
    })

    // Update depreciation with entry ID
    await prisma.depreciation.update({
      where: { id: depreciationId },
      data: {
        entryId: entry.id
      }
    })
  } catch (error) {
    console.error('Error booking depreciation:', error)
    throw new Error(`Failed to book depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Run monthly depreciation for all active assets
 * Should be executed automatically via cron job at the beginning of each month
 */
export async function runMonthlyDepreciation(userId: string): Promise<{
  processed: number
  booked: number
  errors: string[]
}> {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // Get all active assets that need depreciation
    const assets = await prisma.asset.findMany({
      where: {
        status: 'ACTIVE',
        fullyDepreciated: false,
        acquisitionDate: {
          lte: now // Only assets acquired before or in current month
        }
      }
    })

    const results = {
      processed: 0,
      booked: 0,
      errors: [] as string[]
    }

    for (const asset of assets) {
      try {
        // Calculate depreciation for current month
        const depreciation = await calculateMonthlyDepreciation(asset.id, year, month)
        results.processed++

        // Book depreciation to accounting
        await bookDepreciation(depreciation.id, userId)
        results.booked++

      } catch (error) {
        const errorMessage = `Asset ${asset.assetNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMessage)
        console.error(errorMessage)
      }
    }

    return results
  } catch (error) {
    console.error('Error running monthly depreciation:', error)
    throw new Error(`Failed to run monthly depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get depreciation schedule for an asset
 * Returns all past and future depreciation entries
 */
export async function getDepreciationSchedule(assetId: string): Promise<Depreciation[]> {
  try {
    const depreciations = await prisma.depreciation.findMany({
      where: { assetId },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    })

    return depreciations
  } catch (error) {
    console.error('Error getting depreciation schedule:', error)
    throw new Error(`Failed to get depreciation schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Recalculate depreciation for an asset (e.g., after correction)
 * Deletes existing unbooked depreciations and recalculates
 */
export async function recalculateDepreciation(assetId: string): Promise<void> {
  try {
    // Delete all unbooked future depreciations
    await prisma.depreciation.deleteMany({
      where: {
        assetId,
        entryId: null
      }
    })

    // Reset asset to last booked state
    const lastBooked = await prisma.depreciation.findFirst({
      where: {
        assetId,
        entryId: { not: null }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    if (lastBooked) {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          bookValue: lastBooked.bookValue,
          fullyDepreciated: lastBooked.bookValue <= 1
        }
      })
    }
  } catch (error) {
    console.error('Error recalculating depreciation:', error)
    throw new Error(`Failed to recalculate depreciation: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
