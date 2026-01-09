import { prisma } from '@/lib/prisma'
import { IncomeStatement } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Income Statement Service (Gewinn- und Verlustrechnung - GuV)
 * Generates profit & loss statements for GmbH according to HGB §275
 */

interface IncomeStatementData {
  revenue: {
    umsatzerloese: number // 8xxx accounts
    sonstigeBetrieblicheErtraege: number // Other operating income
  }
  expenses: {
    materialaufwand: number // 4xxx accounts
    personalaufwand: number // 6xxx accounts (wages, social)
    abschreibungen: number // 6220 depreciation
    sonstigeBetrieblicheAufwendungen: number // Other operating expenses
    zinsenUndAehnlicheAufwendungen: number // Interest
    steuern: number // Taxes
  }
}

/**
 * Generate income statement (GuV) for a specific year
 * Collects all revenue and expense accounts
 */
export async function generateIncomeStatement(
  year: number,
  fiscalYear?: string
): Promise<IncomeStatement> {
  try {
    // Check if income statement already exists
    const existing = await prisma.incomeStatement.findUnique({
      where: { year }
    })

    if (existing && existing.locked) {
      throw new Error(`Income statement for year ${year} is already locked`)
    }

    // Calculate revenue and expenses
    const revenue = await calculateRevenue(year)
    const expenses = await calculateExpenses(year)
    const netIncome = await calculateNetIncome(year)

    const totalRevenue = new Decimal(
      revenue.umsatzerloese + revenue.sonstigeBetrieblicheErtraege
    )

    const totalExpenses = new Decimal(
      expenses.materialaufwand +
      expenses.personalaufwand +
      expenses.abschreibungen +
      expenses.sonstigeBetrieblicheAufwendungen +
      expenses.zinsenUndAehnlicheAufwendungen +
      expenses.steuern
    )

    const incomeStatementData = {
      revenue,
      expenses
    }

    // Create or update income statement
    const incomeStatement = existing
      ? await prisma.incomeStatement.update({
          where: { year },
          data: {
            fiscalYear: fiscalYear || year.toString(),
            revenue: incomeStatementData.revenue as any,
            expenses: incomeStatementData.expenses as any,
            netIncome,
            updatedAt: new Date()
          }
        })
      : await prisma.incomeStatement.create({
          data: {
            year,
            fiscalYear: fiscalYear || year.toString(),
            revenue: incomeStatementData.revenue as any,
            expenses: incomeStatementData.expenses as any,
            netIncome
          }
        })

    return incomeStatement
  } catch (error) {
    console.error('Error generating income statement:', error)
    throw new Error(`Failed to generate income statement: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate all revenue accounts (Erträge)
 * Account range: 8xxx (Erlöskonten)
 */
export async function calculateRevenue(year: number) {
  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    // Get all accounting entries for the year
    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const revenue = {
      umsatzerloese: 0,
      sonstigeBetrieblicheErtraege: 0
    }

    // Calculate revenue balances
    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Credit increases revenue accounts (8xxx)
      const creditAccount = entry.creditAccount
      if (creditAccount.startsWith('8')) {
        revenue.umsatzerloese += amount
      }

      // Debit decreases revenue accounts (returns, discounts)
      const debitAccount = entry.debitAccount
      if (debitAccount.startsWith('8')) {
        revenue.umsatzerloese -= amount
      }

      // Other operating income (e.g., income from disposal of assets)
      if (creditAccount >= '4800' && creditAccount <= '4899') {
        revenue.sonstigeBetrieblicheErtraege += amount
      }
    }

    return revenue
  } catch (error) {
    console.error('Error calculating revenue:', error)
    throw new Error(`Failed to calculate revenue: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate all expense accounts (Aufwendungen)
 * Account ranges: 4xxx (Material), 6xxx (Operating expenses)
 */
export async function calculateExpenses(year: number) {
  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    // Get all accounting entries for the year
    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const expenses = {
      materialaufwand: 0, // 4xxx accounts
      personalaufwand: 0, // 6000-6299 wages and social
      abschreibungen: 0, // 6220 depreciation
      sonstigeBetrieblicheAufwendungen: 0, // 6300-6999
      zinsenUndAehnlicheAufwendungen: 0, // 7xxx interest
      steuern: 0 // Various tax accounts
    }

    // Calculate expense balances
    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Debit increases expense accounts
      const debitAccount = entry.debitAccount
      
      // Material costs (4xxx)
      if (debitAccount.startsWith('4') && debitAccount < '4800') {
        expenses.materialaufwand += amount
      }
      
      // Personnel costs (6000-6299)
      if (debitAccount >= '6000' && debitAccount <= '6299') {
        if (debitAccount === '6220') {
          expenses.abschreibungen += amount
        } else {
          expenses.personalaufwand += amount
        }
      }
      
      // Other operating expenses (6300-6999)
      if (debitAccount >= '6300' && debitAccount <= '6999') {
        expenses.sonstigeBetrieblicheAufwendungen += amount
      }
      
      // Interest and similar expenses (7xxx)
      if (debitAccount.startsWith('7')) {
        expenses.zinsenUndAehnlicheAufwendungen += amount
      }

      // Credit decreases expense accounts (corrections, refunds)
      const creditAccount = entry.creditAccount
      
      if (creditAccount.startsWith('4') && creditAccount < '4800') {
        expenses.materialaufwand -= amount
      }
      
      if (creditAccount >= '6000' && creditAccount <= '6299') {
        if (creditAccount === '6220') {
          expenses.abschreibungen -= amount
        } else {
          expenses.personalaufwand -= amount
        }
      }
      
      if (creditAccount >= '6300' && creditAccount <= '6999') {
        expenses.sonstigeBetrieblicheAufwendungen -= amount
      }
      
      if (creditAccount.startsWith('7')) {
        expenses.zinsenUndAehnlicheAufwendungen -= amount
      }
    }

    return expenses
  } catch (error) {
    console.error('Error calculating expenses:', error)
    throw new Error(`Failed to calculate expenses: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate net income (Jahresüberschuss/Jahresfehlbetrag)
 * Formula: Revenue - Expenses
 */
export async function calculateNetIncome(year: number): Promise<Decimal> {
  try {
    const revenue = await calculateRevenue(year)
    const expenses = await calculateExpenses(year)

    const totalRevenue = revenue.umsatzerloese + revenue.sonstigeBetrieblicheErtraege
    const totalExpenses = 
      expenses.materialaufwand +
      expenses.personalaufwand +
      expenses.abschreibungen +
      expenses.sonstigeBetrieblicheAufwendungen +
      expenses.zinsenUndAehnlicheAufwendungen +
      expenses.steuern

    const netIncome = totalRevenue - totalExpenses

    return new Decimal(netIncome)
  } catch (error) {
    console.error('Error calculating net income:', error)
    throw new Error(`Failed to calculate net income: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Lock income statement for year-end closing
 * Once locked, cannot be modified
 */
export async function lockIncomeStatement(id: string): Promise<IncomeStatement> {
  try {
    const incomeStatement = await prisma.incomeStatement.findUnique({
      where: { id }
    })

    if (!incomeStatement) {
      throw new Error('Income statement not found')
    }

    if (incomeStatement.locked) {
      throw new Error('Income statement is already locked')
    }

    return await prisma.incomeStatement.update({
      where: { id },
      data: {
        locked: true,
        lockedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error locking income statement:', error)
    throw new Error(`Failed to lock income statement: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Approve income statement (final approval)
 */
export async function approveIncomeStatement(id: string, userId: string): Promise<IncomeStatement> {
  try {
    const incomeStatement = await prisma.incomeStatement.findUnique({
      where: { id }
    })

    if (!incomeStatement) {
      throw new Error('Income statement not found')
    }

    if (!incomeStatement.locked) {
      throw new Error('Income statement must be locked before approval')
    }

    if (incomeStatement.approvedBy) {
      throw new Error('Income statement is already approved')
    }

    return await prisma.incomeStatement.update({
      where: { id },
      data: {
        approvedBy: userId
      }
    })
  } catch (error) {
    console.error('Error approving income statement:', error)
    throw new Error(`Failed to approve income statement: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
