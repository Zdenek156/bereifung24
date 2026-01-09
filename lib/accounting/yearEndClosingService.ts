import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { AccountingBookingService } from './bookingService'
import { generateBalanceSheet, lockBalanceSheet } from './balanceSheetService'
import { generateIncomeStatement, lockIncomeStatement } from './incomeStatementService'
import { reviewYearEndProvisions } from './provisionService'

/**
 * Year-End Closing Service (Jahresabschluss)
 * Manages the complete year-end closing workflow for GmbH
 * Includes GuV closing, balance sheet generation, and opening balance creation
 */

interface YearEndClosingStatus {
  year: number
  step: 'INITIATED' | 'GUV_CLOSED' | 'BALANCE_SHEET_CREATED' | 'OPENING_BALANCE_CREATED' | 'FINALIZED'
  incomeStatementId?: string
  balanceSheetId?: string
  netIncome?: number
  completedSteps: string[]
  errors: string[]
}

/**
 * Initiate year-end closing process
 * Creates the workflow and performs initial checks
 */
export async function initiateYearEnd(
  year: number,
  fiscalYear?: string,
  userId?: string
): Promise<YearEndClosingStatus> {
  try {
    // Check if year-end closing already exists
    const existingClosing = await prisma.accountingSetting.findFirst()
    
    if (!existingClosing) {
      throw new Error('Accounting settings not initialized')
    }

    const status: YearEndClosingStatus = {
      year,
      step: 'INITIATED',
      completedSteps: [],
      errors: []
    }

    // Verify all entries are locked for the year
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const unlockedEntries = await prisma.accountingEntry.count({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        },
        locked: false
      }
    })

    if (unlockedEntries > 0) {
      status.errors.push(`${unlockedEntries} unlocked entries found. All entries must be locked before year-end closing.`)
      return status
    }

    status.completedSteps.push('Verified all entries are locked')

    // Review provisions
    try {
      const provisionReview = await reviewYearEndProvisions(year)
      if (provisionReview.active.length > 0) {
        status.completedSteps.push(`Reviewed ${provisionReview.active.length} active provisions (Total: ${provisionReview.totalAmount.toFixed(2)} EUR)`)
      }
    } catch (error) {
      status.errors.push(`Provision review failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    status.completedSteps.push('Year-end closing initiated')
    return status

  } catch (error) {
    console.error('Error initiating year-end:', error)
    throw new Error(`Failed to initiate year-end closing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Close GuV accounts (Gewinn- und Verlustrechnung)
 * Transfer profit/loss to capital account (2880 Jahresüberschuss)
 */
export async function closeGUVAccounts(
  year: number,
  userId: string
): Promise<{
  incomeStatementId: string
  netIncome: number
  entryId: string
}> {
  try {
    // Generate income statement
    const incomeStatement = await generateIncomeStatement(year)
    const netIncome = incomeStatement.netIncome.toNumber()

    // Lock the income statement
    await lockIncomeStatement(incomeStatement.id)

    // Close all revenue and expense accounts to P&L summary account
    // Then transfer P&L result to capital account 2880 (Jahresüberschuss)
    
    const bookingService = new AccountingBookingService()
    const closingDate = new Date(year, 11, 31, 23, 59, 59)

    let closingEntry

    if (netIncome > 0) {
      // Profit: Soll 2880 (Jahresüberschuss) / Haben GuV-Sammelkonto
      // In SKR04, we book directly: Soll GuV-Abschluss / Haben 2880
      closingEntry = await bookingService.createBooking({
        debitAccountNumber: '8020', // GuV-Abschlusskonto
        creditAccountNumber: '2880', // Jahresüberschuss
        amount: netIncome,
        description: `Jahresabschluss ${year} - Gewinnvortrag`,
        bookingDate: closingDate,
        sourceType: 'MANUAL',
        sourceId: incomeStatement.id,
        createdByUserId: userId
      })
    } else if (netIncome < 0) {
      // Loss: Soll 2880 (Jahresfehlbetrag) / Haben GuV-Abschluss
      closingEntry = await bookingService.createBooking({
        debitAccountNumber: '2880', // Jahresfehlbetrag (negative)
        creditAccountNumber: '8020', // GuV-Abschlusskonto
        amount: Math.abs(netIncome),
        description: `Jahresabschluss ${year} - Verlustvortrag`,
        bookingDate: closingDate,
        sourceType: 'MANUAL',
        sourceId: incomeStatement.id,
        createdByUserId: userId
      })
    } else {
      // No profit or loss - create a note entry
      closingEntry = await bookingService.createBooking({
        debitAccountNumber: '8020',
        creditAccountNumber: '8020',
        amount: 0.01, // Minimum amount for record
        description: `Jahresabschluss ${year} - Ausgeglichen`,
        bookingDate: closingDate,
        sourceType: 'MANUAL',
        sourceId: incomeStatement.id,
        createdByUserId: userId
      })
    }

    return {
      incomeStatementId: incomeStatement.id,
      netIncome,
      entryId: closingEntry.id
    }

  } catch (error) {
    console.error('Error closing GuV accounts:', error)
    throw new Error(`Failed to close GuV accounts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create opening balance for next year
 * Transfer all balance sheet accounts to the new year
 */
export async function createOpeningBalance(
  year: number,
  userId: string
): Promise<{
  balanceSheetId: string
  entryCount: number
}> {
  try {
    const previousYear = year - 1

    // Generate balance sheet for previous year
    const previousBalanceSheet = await generateBalanceSheet(previousYear)
    
    // Lock previous year's balance sheet
    await lockBalanceSheet(previousBalanceSheet.id, userId)

    // Get all balance sheet account balances
    const startDate = new Date(previousYear, 0, 1)
    const endDate = new Date(previousYear, 11, 31, 23, 59, 59)

    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate final balances for each account
    const accountBalances = new Map<string, number>()

    for (const entry of entries) {
      const amount = entry.amount.toNumber()
      
      // Debit increases assets and decreases liabilities
      const debit = accountBalances.get(entry.debitAccount) || 0
      accountBalances.set(entry.debitAccount, debit + amount)
      
      // Credit increases liabilities and decreases assets
      const credit = accountBalances.get(entry.creditAccount) || 0
      accountBalances.set(entry.creditAccount, credit - amount)
    }

    // Transfer profit/loss to capital account
    const incomeStatement = await prisma.incomeStatement.findUnique({
      where: { year: previousYear }
    })

    if (incomeStatement) {
      // Move Jahresüberschuss (2880) to Gewinnvortrag (2870)
      const netIncome = incomeStatement.netIncome.toNumber()
      const currentGewinnvortrag = accountBalances.get('2870') || 0
      accountBalances.set('2870', currentGewinnvortrag + netIncome)
      accountBalances.delete('2880') // Clear current year result
    }

    // Create opening entries for new year
    const bookingService = new AccountingBookingService()
    const openingDate = new Date(year, 0, 1)
    let entryCount = 0

    // Create opening balance entry for each account with non-zero balance
    for (const [account, balance] of accountBalances.entries()) {
      if (Math.abs(balance) < 0.01) continue // Skip near-zero balances

      // Determine if account is asset or liability
      const firstDigit = account.charAt(0)
      const isAsset = firstDigit === '0' || firstDigit === '1'

      if (isAsset && balance > 0) {
        // Asset with debit balance: Soll Asset / Haben 9000 (Eröffnungsbilanzkonto)
        await bookingService.createBooking({
          debitAccountNumber: account,
          creditAccountNumber: '9000', // Eröffnungsbilanzkonto
          amount: balance,
          description: `Eröffnungsbilanz ${year}`,
          bookingDate: openingDate,
          sourceType: 'MANUAL',
          createdByUserId: userId
        })
        entryCount++
      } else if (!isAsset && balance < 0) {
        // Liability with credit balance: Soll 9000 / Haben Liability
        await bookingService.createBooking({
          debitAccountNumber: '9000', // Eröffnungsbilanzkonto
          creditAccountNumber: account,
          amount: Math.abs(balance),
          description: `Eröffnungsbilanz ${year}`,
          bookingDate: openingDate,
          sourceType: 'MANUAL',
          createdByUserId: userId
        })
        entryCount++
      }
    }

    return {
      balanceSheetId: previousBalanceSheet.id,
      entryCount
    }

  } catch (error) {
    console.error('Error creating opening balance:', error)
    throw new Error(`Failed to create opening balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Finalize year-end closing
 * Complete all steps and lock the year
 */
export async function finalizeYearEnd(
  year: number,
  userId: string
): Promise<YearEndClosingStatus> {
  try {
    const status: YearEndClosingStatus = {
      year,
      step: 'INITIATED',
      completedSteps: [],
      errors: []
    }

    // Step 1: Initiate year-end
    const initiateResult = await initiateYearEnd(year, undefined, userId)
    status.completedSteps.push(...initiateResult.completedSteps)
    status.errors.push(...initiateResult.errors)

    if (status.errors.length > 0) {
      return status
    }

    // Step 2: Close GuV accounts
    try {
      const guvResult = await closeGUVAccounts(year, userId)
      status.incomeStatementId = guvResult.incomeStatementId
      status.netIncome = guvResult.netIncome
      status.step = 'GUV_CLOSED'
      status.completedSteps.push(`GuV closed with net income: ${guvResult.netIncome.toFixed(2)} EUR`)
    } catch (error) {
      status.errors.push(`GuV closing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return status
    }

    // Step 3: Create balance sheet
    try {
      const balanceSheet = await generateBalanceSheet(year)
      await lockBalanceSheet(balanceSheet.id, userId)
      status.balanceSheetId = balanceSheet.id
      status.step = 'BALANCE_SHEET_CREATED'
      status.completedSteps.push(`Balance sheet created and locked`)
    } catch (error) {
      status.errors.push(`Balance sheet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return status
    }

    // Step 4: Create opening balance for next year
    try {
      const openingResult = await createOpeningBalance(year + 1, userId)
      status.step = 'OPENING_BALANCE_CREATED'
      status.completedSteps.push(`Opening balance created with ${openingResult.entryCount} entries`)
    } catch (error) {
      status.errors.push(`Opening balance failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return status
    }

    // Step 5: Finalize
    status.step = 'FINALIZED'
    status.completedSteps.push(`Year-end closing ${year} completed successfully`)

    return status

  } catch (error) {
    console.error('Error finalizing year-end:', error)
    throw new Error(`Failed to finalize year-end closing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get year-end closing status
 * Check progress of current year-end closing
 */
export async function getYearEndStatus(year: number): Promise<{
  hasIncomeStatement: boolean
  hasBalanceSheet: boolean
  incomeStatementLocked: boolean
  balanceSheetLocked: boolean
  balanceSheetApproved: boolean
  nextYearHasOpeningBalance: boolean
}> {
  try {
    const incomeStatement = await prisma.incomeStatement.findUnique({
      where: { year }
    })

    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    const nextYearStartDate = new Date(year + 1, 0, 1)
    const nextYearFirstEntry = await prisma.accountingEntry.findFirst({
      where: {
        bookingDate: {
          gte: nextYearStartDate,
          lt: new Date(year + 1, 0, 2)
        },
        description: {
          contains: 'Eröffnungsbilanz'
        }
      }
    })

    return {
      hasIncomeStatement: !!incomeStatement,
      hasBalanceSheet: !!balanceSheet,
      incomeStatementLocked: incomeStatement?.locked || false,
      balanceSheetLocked: balanceSheet?.locked || false,
      balanceSheetApproved: !!balanceSheet?.approvedBy,
      nextYearHasOpeningBalance: !!nextYearFirstEntry
    }
  } catch (error) {
    console.error('Error getting year-end status:', error)
    throw new Error(`Failed to get year-end status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Reopen year-end (for corrections)
 * Only possible if next year's opening balance has not been used for bookings
 */
export async function reopenYearEnd(year: number, userId: string): Promise<void> {
  try {
    // Check if next year has any bookings beyond opening balance
    const nextYearStartDate = new Date(year + 1, 0, 2) // Day after opening balance
    const nextYearBookings = await prisma.accountingEntry.count({
      where: {
        bookingDate: {
          gte: nextYearStartDate
        }
      }
    })

    if (nextYearBookings > 0) {
      throw new Error('Cannot reopen year-end: Next year has bookings. Manual correction required.')
    }

    // Unlock income statement
    const incomeStatement = await prisma.incomeStatement.findUnique({
      where: { year }
    })

    if (incomeStatement) {
      await prisma.incomeStatement.update({
        where: { id: incomeStatement.id },
        data: {
          locked: false,
          lockedAt: null,
          approvedBy: null
        }
      })
    }

    // Unlock balance sheet
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    if (balanceSheet) {
      await prisma.balanceSheet.update({
        where: { id: balanceSheet.id },
        data: {
          locked: false,
          lockedAt: null,
          approvedBy: null
        }
      })
    }

    // Delete opening balance entries for next year
    await prisma.accountingEntry.deleteMany({
      where: {
        bookingDate: {
          gte: new Date(year + 1, 0, 1),
          lt: new Date(year + 1, 0, 2)
        },
        description: {
          contains: 'Eröffnungsbilanz'
        }
      }
    })

  } catch (error) {
    console.error('Error reopening year-end:', error)
    throw new Error(`Failed to reopen year-end: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
