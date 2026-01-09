import { prisma } from '@/lib/prisma'
import { IncomeStatement } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Income Statement Service (Gewinn- und Verlustrechnung - GuV)
 * Generates profit & loss statements for GmbH according to HGB §275
 */

interface IncomeStatementData {
  revenue: {
    umsatzerloese: number
    bestandsveraenderungen: number
    andereAktivierteEigenleistungen: number
    sonstigeBetrieblicheErtraege: number
  }
  expenses: {
    materialaufwand: {
      aufwendungenRohHilfsBetriebsstoffe: number
      aufwendungenBezogeneLeistungen: number
    }
    personalaufwand: {
      loehneGehaelter: number
      sozialeAbgaben: number
      altersversorgung: number
    }
    abschreibungen: number
    sonstigeBetrieblicheAufwendungen: number
    zinsenAehnlicheAufwendungen: number
    steuernVomEinkommenErtrag: number
    sonstigeSteuern: number
  }
  financialResult: {
    zinsertraege: number
    beteiligungsertraege: number
    zinsenAehnlicheAufwendungen: number
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
    const financialResult = await calculateFinancialResult(year)
    const netIncome = await calculateNetIncome(year)

    const totalRevenue = new Decimal(
      revenue.umsatzerloese + 
      revenue.bestandsveraenderungen + 
      revenue.andereAktivierteEigenleistungen + 
      revenue.sonstigeBetrieblicheErtraege
    )

    const totalExpenses = new Decimal(
      expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe +
      expenses.materialaufwand.aufwendungenBezogeneLeistungen +
      expenses.personalaufwand.loehneGehaelter +
      expenses.personalaufwand.sozialeAbgaben +
      expenses.personalaufwand.altersversorgung +
      expenses.abschreibungen +
      expenses.sonstigeBetrieblicheAufwendungen +
      expenses.zinsenAehnlicheAufwendungen +
      expenses.steuernVomEinkommenErtrag +
      expenses.sonstigeSteuern
    )

    const earningsBeforeTax = totalRevenue.minus(totalExpenses)
    const taxes = new Decimal(expenses.steuernVomEinkommenErtrag + expenses.sonstigeSteuern)

    const incomeStatementData = {
      revenue,
      expenses,
      financialResult
    }

    // Create or update income statement
    const incomeStatement = existing
      ? await prisma.incomeStatement.update({
          where: { year },
          data: {
            fiscalYear: fiscalYear || year.toString(),
            revenue: incomeStatementData.revenue as any,
            expenses: incomeStatementData.expenses as any,
            financialResult: incomeStatementData.financialResult as any,
            earningsBeforeTax,
            taxes,
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
            financialResult: incomeStatementData.financialResult as any,
            earningsBeforeTax,
            taxes,
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
      bestandsveraenderungen: 0,
      andereAktivierteEigenleistungen: 0,
      sonstigeBetrieblicheErtraege: 0
    }

    // Calculate revenue balances
    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Credit increases revenue accounts (8xxx)
      const creditAccount = entry.creditAccount
      if (creditAccount >= '8000' && creditAccount <= '8399') {
        revenue.umsatzerloese += amount
      } else if (creditAccount >= '8400' && creditAccount <= '8499') {
        revenue.bestandsveraenderungen += amount
      } else if (creditAccount >= '8500' && creditAccount <= '8599') {
        revenue.andereAktivierteEigenleistungen += amount
      } else if (creditAccount >= '8600' && creditAccount <= '8799') {
        revenue.sonstigeBetrieblicheErtraege += amount
      }

      // Debit decreases revenue accounts (returns, discounts)
      const debitAccount = entry.debitAccount
      if (debitAccount >= '8000' && debitAccount <= '8399') {
        revenue.umsatzerloese -= amount
      } else if (debitAccount >= '8400' && debitAccount <= '8499') {
        revenue.bestandsveraenderungen -= amount
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
      materialaufwand: {
        aufwendungenRohHilfsBetriebsstoffe: 0, // 4000-4099
        aufwendungenBezogeneLeistungen: 0 // 4100-4199
      },
      personalaufwand: {
        loehneGehaelter: 0, // 6000-6099
        sozialeAbgaben: 0, // 6100-6199
        altersversorgung: 0 // 6200-6209
      },
      abschreibungen: 0, // 6220
      sonstigeBetrieblicheAufwendungen: 0, // 6300-6999
      zinsenAehnlicheAufwendungen: 0, // 7000-7099
      steuernVomEinkommenErtrag: 0, // 7200-7299
      sonstigeSteuern: 0 // 7300-7399
    }

    // Calculate expense balances
    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Debit increases expense accounts
      const debitAccount = entry.debitAccount
      
      // Material costs (4xxx)
      if (debitAccount >= '4000' && debitAccount <= '4099') {
        expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe += amount
      } else if (debitAccount >= '4100' && debitAccount <= '4199') {
        expenses.materialaufwand.aufwendungenBezogeneLeistungen += amount
      }
      
      // Personnel costs (6000-6299)
      if (debitAccount >= '6000' && debitAccount <= '6099') {
        expenses.personalaufwand.loehneGehaelter += amount
      } else if (debitAccount >= '6100' && debitAccount <= '6199') {
        expenses.personalaufwand.sozialeAbgaben += amount
      } else if (debitAccount >= '6200' && debitAccount <= '6209') {
        expenses.personalaufwand.altersversorgung += amount
      } else if (debitAccount === '6220') {
        expenses.abschreibungen += amount
      }
      
      // Other operating expenses (6300-6999)
      if (debitAccount >= '6300' && debitAccount <= '6999') {
        expenses.sonstigeBetrieblicheAufwendungen += amount
      }
      
      // Interest and similar expenses (7000-7099)
      if (debitAccount >= '7000' && debitAccount <= '7099') {
        expenses.zinsenAehnlicheAufwendungen += amount
      }

      // Taxes (7200-7399)
      if (debitAccount >= '7200' && debitAccount <= '7299') {
        expenses.steuernVomEinkommenErtrag += amount
      } else if (debitAccount >= '7300' && debitAccount <= '7399') {
        expenses.sonstigeSteuern += amount
      }

      // Credit decreases expense accounts (corrections, refunds)
      const creditAccount = entry.creditAccount
      
      if (creditAccount >= '4000' && creditAccount <= '4099') {
        expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe -= amount
      } else if (creditAccount >= '4100' && creditAccount <= '4199') {
        expenses.materialaufwand.aufwendungenBezogeneLeistungen -= amount
      }
      
      if (creditAccount >= '6000' && creditAccount <= '6099') {
        expenses.personalaufwand.loehneGehaelter -= amount
      } else if (creditAccount >= '6100' && creditAccount <= '6199') {
        expenses.personalaufwand.sozialeAbgaben -= amount
      } else if (creditAccount >= '6200' && creditAccount <= '6209') {
        expenses.personalaufwand.altersversorgung -= amount
      } else if (creditAccount === '6220') {
        expenses.abschreibungen -= amount
      }
      
      if (creditAccount >= '6300' && creditAccount <= '6999') {
        expenses.sonstigeBetrieblicheAufwendungen -= amount
      }
      
      if (creditAccount >= '7000' && creditAccount <= '7099') {
        expenses.zinsenAehnlicheAufwendungen -= amount
      }

      if (creditAccount >= '7200' && creditAccount <= '7299') {
        expenses.steuernVomEinkommenErtrag -= amount
      } else if (creditAccount >= '7300' && creditAccount <= '7399') {
        expenses.sonstigeSteuern -= amount
      }
    }

    return expenses
  } catch (error) {
    console.error('Error calculating expenses:', error)
    throw new Error(`Failed to calculate expenses: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate financial result (Finanzergebnis)
 * Interest income vs interest expenses
 */
export async function calculateFinancialResult(year: number) {
  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const financialResult = {
      zinsertraege: 0,
      beteiligungsertraege: 0,
      zinsenAehnlicheAufwendungen: 0
    }

    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Interest income (credit side)
      if (entry.creditAccount >= '8100' && entry.creditAccount <= '8199') {
        financialResult.zinsertraege += amount
      }
      
      // Investment income
      if (entry.creditAccount >= '8200' && entry.creditAccount <= '8299') {
        financialResult.beteiligungsertraege += amount
      }
      
      // Interest expenses (debit side)
      if (entry.debitAccount >= '7000' && entry.debitAccount <= '7099') {
        financialResult.zinsenAehnlicheAufwendungen += amount
      }
    }

    return financialResult
  } catch (error) {
    console.error('Error calculating financial result:', error)
    throw new Error(`Failed to calculate financial result: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

    const totalRevenue = 
      revenue.umsatzerloese + 
      revenue.bestandsveraenderungen + 
      revenue.andereAktivierteEigenleistungen + 
      revenue.sonstigeBetrieblicheErtraege

    const totalExpenses = 
      expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe +
      expenses.materialaufwand.aufwendungenBezogeneLeistungen +
      expenses.personalaufwand.loehneGehaelter +
      expenses.personalaufwand.sozialeAbgaben +
      expenses.personalaufwand.altersversorgung +
      expenses.abschreibungen +
      expenses.sonstigeBetrieblicheAufwendungen +
      expenses.zinsenAehnlicheAufwendungen +
      expenses.steuernVomEinkommenErtrag +
      expenses.sonstigeSteuern

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
