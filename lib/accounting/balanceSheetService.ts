import { prisma } from '@/lib/prisma'
import { BalanceSheet } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Balance Sheet Service (Bilanz)
 * Generates and manages balance sheets for GmbH according to HGB requirements
 */

interface BalanceSheetData {
  aktiva: {
    anlagevermoegen: {
      immaterielleVermoegensgegenstaende: number
      sachanlagen: number
      finanzanlagen: number
    }
    umlaufvermoegen: {
      vorraete: number
      forderungen: number
      kasseBank: number
    }
    rechnungsabgrenzungsposten: number
  }
  passiva: {
    eigenkapital: {
      gezeichnetesKapital: number
      kapitalruecklagen: number
      gewinnruecklagen: number
      gewinnvortrag: number
      jahresueberschuss: number
    }
    rueckstellungen: {
      pensionsrueckstellungen: number
      steuerrueckstellungen: number
      urlaubsrueckstellungen: number
      gewährleistungsrueckstellungen: number
      sonstigeRueckstellungen: number
    }
    verbindlichkeiten: {
      anleihen: number
      verbindlichkeitenKreditinstitute: number
      erhalteneAnzahlungen: number
      verbindlichkeitenLieferungen: number
      sonstigeVerbindlichkeiten: number
    }
    rechnungsabgrenzungsposten: number
  }
}

/**
 * Generate balance sheet for a specific year
 * Collects all account balances and structures them according to HGB §266
 */
export async function generateBalanceSheet(
  year: number,
  fiscalYear?: string
): Promise<BalanceSheet> {
  try {
    // Check if balance sheet already exists
    const existing = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    if (existing && existing.locked) {
      throw new Error(`Balance sheet for year ${year} is already locked`)
    }

    // Calculate assets and liabilities
    const aktiva = await calculateAssets(year)
    const passiva = await calculateLiabilities(year)

    const totalAssets = new Decimal(
      aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende +
      aktiva.anlagevermoegen.sachanlagen +
      aktiva.anlagevermoegen.finanzanlagen +
      aktiva.umlaufvermoegen.vorraete +
      aktiva.umlaufvermoegen.forderungen +
      aktiva.umlaufvermoegen.kasseBank +
      aktiva.rechnungsabgrenzungsposten
    )

    const totalLiabilities = new Decimal(
      passiva.eigenkapital.gezeichnetesKapital +
      passiva.eigenkapital.kapitalruecklagen +
      passiva.eigenkapital.gewinnruecklagen +
      passiva.eigenkapital.gewinnvortrag +
      passiva.eigenkapital.jahresueberschuss +
      passiva.rueckstellungen.pensionsrueckstellungen +
      passiva.rueckstellungen.steuerrueckstellungen +
      passiva.rueckstellungen.urlaubsrueckstellungen +
      passiva.rueckstellungen.gewährleistungsrueckstellungen +
      passiva.rueckstellungen.sonstigeRueckstellungen +
      passiva.verbindlichkeiten.anleihen +
      passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute +
      passiva.verbindlichkeiten.erhalteneAnzahlungen +
      passiva.verbindlichkeiten.verbindlichkeitenLieferungen +
      passiva.verbindlichkeiten.sonstigeVerbindlichkeiten +
      passiva.rechnungsabgrenzungsposten
    )

    // Ensure balance (assets = liabilities)
    if (!totalAssets.equals(totalLiabilities)) {
      console.warn(`Balance sheet not balanced: Assets ${totalAssets} != Liabilities ${totalLiabilities}`)
    }

    const balanceSheetData: BalanceSheetData = {
      aktiva,
      passiva
    }

    // Create or update balance sheet
    const balanceSheet = existing
      ? await prisma.balanceSheet.update({
          where: { year },
          data: {
            fiscalYear: fiscalYear || year.toString(),
            assets: balanceSheetData.aktiva as any,
            liabilities: balanceSheetData.passiva as any,
            totalAssets,
            totalLiabilities,
            updatedAt: new Date()
          }
        })
      : await prisma.balanceSheet.create({
          data: {
            year,
            fiscalYear: fiscalYear || year.toString(),
            assets: balanceSheetData.aktiva as any,
            liabilities: balanceSheetData.passiva as any,
            totalAssets,
            totalLiabilities
          }
        })

    return balanceSheet
  } catch (error) {
    console.error('Error generating balance sheet:', error)
    throw new Error(`Failed to generate balance sheet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate all asset accounts (Aktiva)
 * Account ranges: 0xxx (Anlagevermögen), 1xxx (Umlaufvermögen)
 */
export async function calculateAssets(year: number) {
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

    // Initialize asset structure
    const assets = {
      anlagevermoegen: {
        immaterielleVermoegensgegenstaende: 0, // 0100
        sachanlagen: 0, // 0200-0280
        finanzanlagen: 0 // 0300-0399
      },
      umlaufvermoegen: {
        vorraete: 0, // 1000-1099
        forderungen: 0, // 1360, 1370, 1400, 1500
        kasseBank: 0 // 1000, 1100, 1140
      },
      rechnungsabgrenzungsposten: 0 // 0980, 0985
    }

    // Calculate balances for each account
    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Debit increases asset accounts
      const debitAccount = entry.debitAccount
      if (debitAccount.startsWith('0100')) {
        assets.anlagevermoegen.immaterielleVermoegensgegenstaende += amount
      } else if (debitAccount >= '0200' && debitAccount <= '0280') {
        assets.anlagevermoegen.sachanlagen += amount
      } else if (debitAccount >= '0300' && debitAccount <= '0399') {
        assets.anlagevermoegen.finanzanlagen += amount
      } else if (debitAccount >= '1000' && debitAccount <= '1099') {
        assets.umlaufvermoegen.vorraete += amount
      } else if (['1360', '1370', '1400', '1500'].includes(debitAccount)) {
        assets.umlaufvermoegen.forderungen += amount
      } else if (['1000', '1100', '1140'].includes(debitAccount)) {
        assets.umlaufvermoegen.kasseBank += amount
      } else if (['0980', '0985'].includes(debitAccount)) {
        assets.rechnungsabgrenzungsposten += amount
      }

      // Credit decreases asset accounts
      const creditAccount = entry.creditAccount
      if (creditAccount.startsWith('0100')) {
        assets.anlagevermoegen.immaterielleVermoegensgegenstaende -= amount
      } else if (creditAccount >= '0200' && creditAccount <= '0280') {
        assets.anlagevermoegen.sachanlagen -= amount
      } else if (creditAccount >= '0300' && creditAccount <= '0399') {
        assets.anlagevermoegen.finanzanlagen -= amount
      } else if (creditAccount >= '1000' && creditAccount <= '1099') {
        assets.umlaufvermoegen.vorraete -= amount
      } else if (['1360', '1370', '1400', '1500'].includes(creditAccount)) {
        assets.umlaufvermoegen.forderungen -= amount
      } else if (['1000', '1100', '1140'].includes(creditAccount)) {
        assets.umlaufvermoegen.kasseBank -= amount
      } else if (['0980', '0985'].includes(creditAccount)) {
        assets.rechnungsabgrenzungsposten -= amount
      }
    }

    return assets
  } catch (error) {
    console.error('Error calculating assets:', error)
    throw new Error(`Failed to calculate assets: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate all liability accounts (Passiva)
 * Account ranges: 2xxx (Eigenkapital), 3xxx (Rückstellungen, Verbindlichkeiten)
 */
export async function calculateLiabilities(year: number) {
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

    // Get provisions for the year
    const provisions = await prisma.provision.findMany({
      where: { year }
    })

    // Initialize liability structure
    const liabilities = {
      eigenkapital: {
        gezeichnetesKapital: 0, // 2800
        kapitalruecklagen: 0, // 2850
        gewinnruecklagen: 0, // 2860
        gewinnvortrag: 0, // 2870
        jahresueberschuss: 0 // 2880
      },
      rueckstellungen: {
        pensionsrueckstellungen: 0, // 3000
        steuerrueckstellungen: 0, // 3010
        urlaubsrueckstellungen: 0, // 3030
        gewährleistungsrueckstellungen: 0, // 3040
        sonstigeRueckstellungen: 0 // 3020
      },
      verbindlichkeiten: {
        anleihen: 0, // 3090
        verbindlichkeitenKreditinstitute: 0, // 3100
        erhalteneAnzahlungen: 0, // 3120
        verbindlichkeitenLieferungen: 0, // 3150
        sonstigeVerbindlichkeiten: 0 // 3160-3199
      },
      rechnungsabgrenzungsposten: 0 // 3990
    }

    // Calculate balances for each account
    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Credit increases liability accounts
      const creditAccount = entry.creditAccount
      if (creditAccount === '2800') {
        liabilities.eigenkapital.gezeichnetesKapital += amount
      } else if (creditAccount === '2850') {
        liabilities.eigenkapital.kapitalruecklagen += amount
      } else if (creditAccount === '2860') {
        liabilities.eigenkapital.gewinnruecklagen += amount
      } else if (creditAccount === '2870') {
        liabilities.eigenkapital.gewinnvortrag += amount
      } else if (creditAccount === '2880') {
        liabilities.eigenkapital.jahresueberschuss += amount
      } else if (creditAccount === '3000') {
        liabilities.rueckstellungen.pensionsrueckstellungen += amount
      } else if (creditAccount === '3010') {
        liabilities.rueckstellungen.steuerrueckstellungen += amount
      } else if (creditAccount === '3030') {
        liabilities.rueckstellungen.urlaubsrueckstellungen += amount
      } else if (creditAccount === '3040') {
        liabilities.rueckstellungen.gewährleistungsrueckstellungen += amount
      } else if (creditAccount === '3020') {
        liabilities.rueckstellungen.sonstigeRueckstellungen += amount
      } else if (creditAccount === '3090') {
        liabilities.verbindlichkeiten.anleihen += amount
      } else if (creditAccount === '3100') {
        liabilities.verbindlichkeiten.verbindlichkeitenKreditinstitute += amount
      } else if (creditAccount === '3120') {
        liabilities.verbindlichkeiten.erhalteneAnzahlungen += amount
      } else if (creditAccount === '3150') {
        liabilities.verbindlichkeiten.verbindlichkeitenLieferungen += amount
      } else if (creditAccount >= '3160' && creditAccount <= '3199') {
        liabilities.verbindlichkeiten.sonstigeVerbindlichkeiten += amount
      } else if (creditAccount === '3990') {
        liabilities.rechnungsabgrenzungsposten += amount
      }

      // Debit decreases liability accounts
      const debitAccount = entry.debitAccount
      if (debitAccount === '2800') {
        liabilities.eigenkapital.gezeichnetesKapital -= amount
      } else if (debitAccount === '2850') {
        liabilities.eigenkapital.kapitalruecklagen -= amount
      } else if (debitAccount === '2860') {
        liabilities.eigenkapital.gewinnruecklagen -= amount
      } else if (debitAccount === '2870') {
        liabilities.eigenkapital.gewinnvortrag -= amount
      } else if (debitAccount === '2880') {
        liabilities.eigenkapital.jahresueberschuss -= amount
      } else if (debitAccount === '3000') {
        liabilities.rueckstellungen.pensionsrueckstellungen -= amount
      } else if (debitAccount === '3010') {
        liabilities.rueckstellungen.steuerrueckstellungen -= amount
      } else if (debitAccount === '3030') {
        liabilities.rueckstellungen.urlaubsrueckstellungen -= amount
      } else if (debitAccount === '3040') {
        liabilities.rueckstellungen.gewährleistungsrueckstellungen -= amount
      } else if (debitAccount === '3020') {
        liabilities.rueckstellungen.sonstigeRueckstellungen -= amount
      } else if (debitAccount === '3090') {
        liabilities.verbindlichkeiten.anleihen -= amount
      } else if (debitAccount === '3100') {
        liabilities.verbindlichkeiten.verbindlichkeitenKreditinstitute -= amount
      } else if (debitAccount === '3120') {
        liabilities.verbindlichkeiten.erhalteneAnzahlungen -= amount
      } else if (debitAccount === '3150') {
        liabilities.verbindlichkeiten.verbindlichkeitenLieferungen -= amount
      } else if (debitAccount >= '3160' && debitAccount <= '3199') {
        liabilities.verbindlichkeiten.sonstigeVerbindlichkeiten -= amount
      } else if (debitAccount === '3990') {
        liabilities.rechnungsabgrenzungsposten -= amount
      }
    }

    // Add provisions
    for (const provision of provisions) {
      if (!provision.released) {
        const provisionAmount = parseFloat(provision.amount.toString())
        
        switch (provision.type) {
          case 'TAX':
            liabilities.rueckstellungen.steuerrueckstellungen += provisionAmount
            break
          case 'VACATION':
            liabilities.rueckstellungen.urlaubsrueckstellungen += provisionAmount
            break
          case 'WARRANTY':
            liabilities.rueckstellungen.gewährleistungsrueckstellungen += provisionAmount
            break
          default:
            liabilities.rueckstellungen.sonstigeRueckstellungen += provisionAmount
        }
      }
    }

    return liabilities
  } catch (error) {
    console.error('Error calculating liabilities:', error)
    throw new Error(`Failed to calculate liabilities: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Lock balance sheet for year-end closing
 * Once locked, cannot be modified
 */
export async function lockBalanceSheet(id: string, userId: string): Promise<BalanceSheet> {
  try {
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { id }
    })

    if (!balanceSheet) {
      throw new Error('Balance sheet not found')
    }

    if (balanceSheet.locked) {
      throw new Error('Balance sheet is already locked')
    }

    return await prisma.balanceSheet.update({
      where: { id },
      data: {
        locked: true,
        lockedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error locking balance sheet:', error)
    throw new Error(`Failed to lock balance sheet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Approve balance sheet (final approval by authorized person)
 * Typically done by Geschäftsführer or authorized signatory
 */
export async function approveBalanceSheet(id: string, userId: string): Promise<BalanceSheet> {
  try {
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { id }
    })

    if (!balanceSheet) {
      throw new Error('Balance sheet not found')
    }

    if (!balanceSheet.locked) {
      throw new Error('Balance sheet must be locked before approval')
    }

    if (balanceSheet.approvedBy) {
      throw new Error('Balance sheet is already approved')
    }

    return await prisma.balanceSheet.update({
      where: { id },
      data: {
        approvedBy: userId
      }
    })
  } catch (error) {
    console.error('Error approving balance sheet:', error)
    throw new Error(`Failed to approve balance sheet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
