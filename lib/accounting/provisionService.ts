import { prisma } from '@/lib/prisma'
import { Provision, ProvisionType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { AccountingBookingService } from './bookingService'

/**
 * Provision Service (Rückstellungen)
 * Manages provisions for uncertain liabilities according to HGB requirements
 * Required for GmbH accounting to comply with prudence principle
 */

/**
 * Create a new provision
 * Provisions are used for probable future liabilities with uncertain timing or amount
 */
export async function createProvision(
  type: ProvisionType,
  amount: number,
  year: number,
  description: string,
  reason?: string
): Promise<Provision> {
  try {
    if (amount <= 0) {
      throw new Error('Provision amount must be greater than zero')
    }

    // Create provision record
    const provision = await prisma.provision.create({
      data: {
        type,
        amount: new Decimal(amount),
        year,
        description,
        reason
      }
    })

    return provision
  } catch (error) {
    console.error('Error creating provision:', error)
    throw new Error(`Failed to create provision: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Book provision to accounting
 * Creates accounting entry: Soll 6850 (Zuführung zu Rückstellungen) / Haben 30xx (Rückstellung)
 */
export async function bookProvision(
  provisionId: string,
  userId: string
): Promise<void> {
  try {
    const provision = await prisma.provision.findUnique({
      where: { id: provisionId }
    })

    if (!provision) {
      throw new Error('Provision not found')
    }

    if (provision.entryId) {
      throw new Error('Provision already booked')
    }

    if (provision.released) {
      throw new Error('Provision has been released')
    }

    // Determine provision account based on type
    let provisionAccount = '3020' // Default: Sonstige Rückstellungen

    switch (provision.type) {
      case 'TAX':
        provisionAccount = '3010' // Steuerrückstellungen
        break
      case 'VACATION':
        provisionAccount = '3030' // Urlaubsrückstellungen
        break
      case 'WARRANTY':
        provisionAccount = '3040' // Gewährleistungsrückstellungen
        break
      case 'PENSION':
        provisionAccount = '3000' // Pensionsrückstellungen
        break
      case 'LEGAL':
      case 'RESTRUCTURING':
      case 'OTHER':
        provisionAccount = '3020' // Sonstige Rückstellungen
        break
    }

    // Create accounting entry
    const bookingService = new AccountingBookingService()
    const bookingDate = new Date(provision.year, 11, 31) // Book at year end

    const entry = await bookingService.createBooking({
      debitAccountNumber: '6850', // Zuführung zu sonstigen Rückstellungen
      creditAccountNumber: provisionAccount,
      amount: provision.amount.toNumber(),
      description: `Rückstellung: ${provision.description}`,
      bookingDate,
      sourceType: 'MANUAL',
      sourceId: provisionId,
      createdByUserId: userId
    })

    // Update provision with entry ID
    await prisma.provision.update({
      where: { id: provisionId },
      data: {
        entryId: entry.id
      }
    })
  } catch (error) {
    console.error('Error booking provision:', error)
    throw new Error(`Failed to book provision: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Release a provision when it's no longer needed
 * Creates reversal entry: Soll 30xx (Rückstellung) / Haben 6950 (Auflösung Rückstellungen)
 */
export async function releaseProvision(
  provisionId: string,
  userId: string,
  releaseAmount?: number,
  releaseReason?: string
): Promise<void> {
  try {
    const provision = await prisma.provision.findUnique({
      where: { id: provisionId }
    })

    if (!provision) {
      throw new Error('Provision not found')
    }

    if (provision.released) {
      throw new Error('Provision has already been released')
    }

    if (!provision.entryId) {
      throw new Error('Provision must be booked before it can be released')
    }

    // Use full amount if not specified
    const amountToRelease = releaseAmount || provision.amount.toNumber()

    if (amountToRelease > provision.amount.toNumber()) {
      throw new Error('Release amount cannot exceed provision amount')
    }

    if (amountToRelease <= 0) {
      throw new Error('Release amount must be greater than zero')
    }

    // Determine provision account based on type
    let provisionAccount = '3020'

    switch (provision.type) {
      case 'TAX':
        provisionAccount = '3010'
        break
      case 'VACATION':
        provisionAccount = '3030'
        break
      case 'WARRANTY':
        provisionAccount = '3040'
        break
      case 'PENSION':
        provisionAccount = '3000'
        break
      default:
        provisionAccount = '3020'
    }

    // Create reversal entry
    const bookingService = new AccountingBookingService()
    const bookingDate = new Date()

    await bookingService.createBooking({
      debitAccountNumber: provisionAccount, // Rückstellung
      creditAccountNumber: '6950', // Auflösung von sonstigen Rückstellungen
      amount: amountToRelease,
      description: `Auflösung Rückstellung: ${provision.description}${releaseReason ? ` - ${releaseReason}` : ''}`,
      bookingDate,
      sourceType: 'MANUAL',
      sourceId: provisionId,
      createdByUserId: userId
    })

    // Update provision as released
    await prisma.provision.update({
      where: { id: provisionId },
      data: {
        released: true,
        releasedAt: new Date(),
        releasedAmount: new Decimal(amountToRelease),
        notes: releaseReason || provision.notes
      }
    })
  } catch (error) {
    console.error('Error releasing provision:', error)
    throw new Error(`Failed to release provision: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all provisions for a specific year
 */
export async function getProvisionsByYear(year: number): Promise<Provision[]> {
  try {
    const provisions = await prisma.provision.findMany({
      where: { year },
      orderBy: { createdAt: 'desc' }
    })

    return provisions
  } catch (error) {
    console.error('Error getting provisions by year:', error)
    throw new Error(`Failed to get provisions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get all active (unreleased) provisions
 */
export async function getActiveProvisions(): Promise<Provision[]> {
  try {
    const provisions = await prisma.provision.findMany({
      where: { released: false },
      orderBy: { createdAt: 'desc' }
    })

    return provisions
  } catch (error) {
    console.error('Error getting active provisions:', error)
    throw new Error(`Failed to get active provisions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get provisions by type
 */
export async function getProvisionsByType(type: ProvisionType): Promise<Provision[]> {
  try {
    const provisions = await prisma.provision.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' }
    })

    return provisions
  } catch (error) {
    console.error('Error getting provisions by type:', error)
    throw new Error(`Failed to get provisions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update provision amount (before booking)
 * Can only be updated if not yet booked
 */
export async function updateProvisionAmount(
  provisionId: string,
  newAmount: number,
  reason?: string
): Promise<Provision> {
  try {
    const provision = await prisma.provision.findUnique({
      where: { id: provisionId }
    })

    if (!provision) {
      throw new Error('Provision not found')
    }

    if (provision.entryId) {
      throw new Error('Cannot update provision that has been booked')
    }

    if (provision.released) {
      throw new Error('Cannot update released provision')
    }

    if (newAmount <= 0) {
      throw new Error('Provision amount must be greater than zero')
    }

    return await prisma.provision.update({
      where: { id: provisionId },
      data: {
        amount: new Decimal(newAmount),
        reason: reason || provision.reason,
        updatedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error updating provision amount:', error)
    throw new Error(`Failed to update provision: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate total provisions by type for reporting
 */
export async function calculateProvisionTotals(year?: number): Promise<Record<ProvisionType, number>> {
  try {
    const whereClause = year ? { year, released: false } : { released: false }

    const provisions = await prisma.provision.findMany({
      where: whereClause
    })

    const totals: Record<ProvisionType, number> = {
      TAX: 0,
      VACATION: 0,
      WARRANTY: 0,
      LEGAL: 0,
      RESTRUCTURING: 0,
      PENSION: 0,
      OTHER: 0
    }

    for (const provision of provisions) {
      totals[provision.type] += provision.amount.toNumber()
    }

    return totals
  } catch (error) {
    console.error('Error calculating provision totals:', error)
    throw new Error(`Failed to calculate provision totals: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Review provisions at year end
 * Returns list of provisions that may need adjustment or release
 */
export async function reviewYearEndProvisions(year: number): Promise<{
  active: Provision[]
  totalAmount: number
  byType: Record<ProvisionType, number>
}> {
  try {
    const active = await prisma.provision.findMany({
      where: {
        year: { lte: year },
        released: false
      },
      orderBy: { year: 'asc' }
    })

    const byType = await calculateProvisionTotals(year)
    
    const totalAmount = active.reduce(
      (sum, provision) => sum + provision.amount.toNumber(),
      0
    )

    return {
      active,
      totalAmount,
      byType
    }
  } catch (error) {
    console.error('Error reviewing year-end provisions:', error)
    throw new Error(`Failed to review provisions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
