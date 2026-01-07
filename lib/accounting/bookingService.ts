import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Central Accounting Booking Service
 * Automatically creates accounting entries (Buchungseinträge) for various business transactions
 * Following SKR04 chart of accounts and GoBD compliance requirements
 */

interface BookingParams {
  debitAccountNumber: string
  creditAccountNumber: string
  amount: number
  description: string
  bookingDate: Date
  sourceType: 'COMMISSION' | 'EXPENSE' | 'TRAVEL_EXPENSE' | 'PAYROLL' | 'PROCUREMENT' | 'INFLUENCER' | 'VEHICLE' | 'MANUAL'
  sourceId?: string
  referenceNumber?: string
  createdByUserId: string
}

export class AccountingBookingService {
  /**
   * Generate next entry number in format: BEL-YYYY-NNNNNN
   */
  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear()
    
    // Get or create settings
    let settings = await prisma.accountingSetting.findFirst()
    
    if (!settings) {
      settings = await prisma.accountingSetting.create({
        data: {
          fiscalYearStart: 1,
          entryNumberCounter: 1,
          entryNumberPrefix: 'BEL',
          taxAdvisorName: '',
          taxAdvisorEmail: '',
          defaultVatRate: 19,
          reducedVatRate: 7,
          preferredExportFormat: 'DATEV'
        }
      })
    }

    const entryNumber = `${settings.entryNumberPrefix}-${year}-${String(settings.entryNumberCounter).padStart(6, '0')}`
    
    // Increment counter
    await prisma.accountingSetting.update({
      where: { id: settings.id },
      data: {
        entryNumberCounter: settings.entryNumberCounter + 1
      }
    })

    return entryNumber
  }

  /**
   * Validate that both accounts exist and are active
   */
  private async validateAccounts(debitAccountNumber: string, creditAccountNumber: string): Promise<boolean> {
    const [debitAccount, creditAccount] = await Promise.all([
      prisma.chartOfAccounts.findFirst({
        where: {
          accountNumber: debitAccountNumber,
          isActive: true
        }
      }),
      prisma.chartOfAccounts.findFirst({
        where: {
          accountNumber: creditAccountNumber,
          isActive: true
        }
      })
    ])

    if (!debitAccount) {
      throw new Error(`Debit account ${debitAccountNumber} not found or inactive`)
    }

    if (!creditAccount) {
      throw new Error(`Credit account ${creditAccountNumber} not found or inactive`)
    }

    return true
  }

  /**
   * Create a new accounting entry (booking)
   * Soll an Haben booking (Debit to Credit)
   */
  async createBooking(params: BookingParams): Promise<any> {
    // Validate accounts exist
    await this.validateAccounts(params.debitAccountNumber, params.creditAccountNumber)

    // Generate entry number
    const entryNumber = await this.generateEntryNumber()

    // Create the booking entry
    const entry = await prisma.accountingEntry.create({
      data: {
        entryNumber,
        bookingDate: params.bookingDate,
        debitAccountId: (await prisma.chartOfAccounts.findFirst({
          where: { accountNumber: params.debitAccountNumber }
        }))!.id,
        creditAccountId: (await prisma.chartOfAccounts.findFirst({
          where: { accountNumber: params.creditAccountNumber }
        }))!.id,
        amount: new Prisma.Decimal(params.amount),
        description: params.description,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        referenceNumber: params.referenceNumber,
        locked: false,
        isStorno: false,
        createdByUserId: params.createdByUserId
      },
      include: {
        debitAccount: true,
        creditAccount: true
      }
    })

    // Create audit log entry
    await prisma.accountingAuditLog.create({
      data: {
        entryId: entry.id,
        action: 'CREATED',
        userId: params.createdByUserId,
        changes: {
          entryNumber,
          debitAccount: params.debitAccountNumber,
          creditAccount: params.creditAccountNumber,
          amount: params.amount,
          description: params.description
        }
      }
    })

    return entry
  }

  /**
   * Create storno (reversal) entry for an existing booking
   * Required for GoBD compliance - entries cannot be deleted, only reversed
   */
  async createStorno(originalEntryId: string, userId: string, reason: string): Promise<any> {
    const originalEntry = await prisma.accountingEntry.findUnique({
      where: { id: originalEntryId },
      include: {
        debitAccount: true,
        creditAccount: true
      }
    })

    if (!originalEntry) {
      throw new Error('Original entry not found')
    }

    if (originalEntry.isStorno) {
      throw new Error('Cannot storno a storno entry')
    }

    // Create reverse booking (swap debit and credit)
    const stornoEntry = await this.createBooking({
      debitAccountNumber: originalEntry.creditAccount.accountNumber,
      creditAccountNumber: originalEntry.debitAccount.accountNumber,
      amount: originalEntry.amount.toNumber(),
      description: `STORNO: ${originalEntry.description} (Grund: ${reason})`,
      bookingDate: new Date(),
      sourceType: originalEntry.sourceType,
      sourceId: originalEntry.sourceId || undefined,
      referenceNumber: `STORNO-${originalEntry.entryNumber}`,
      createdByUserId: userId
    })

    // Mark as storno
    await prisma.accountingEntry.update({
      where: { id: stornoEntry.id },
      data: { isStorno: true }
    })

    // Create audit log
    await prisma.accountingAuditLog.create({
      data: {
        entryId: originalEntryId,
        action: 'STORNIERT',
        userId,
        changes: {
          stornoEntryId: stornoEntry.id,
          reason
        }
      }
    })

    return stornoEntry
  }

  /**
   * Lock an entry to make it immutable (GoBD compliance)
   */
  async lockEntry(entryId: string, userId: string): Promise<void> {
    await prisma.accountingEntry.update({
      where: { id: entryId },
      data: {
        locked: true,
        lockedAt: new Date(),
        lockedByUserId: userId
      }
    })

    await prisma.accountingAuditLog.create({
      data: {
        entryId,
        action: 'LOCKED',
        userId,
        changes: { locked: true }
      }
    })
  }

  /**
   * AUTO-BOOKING: Commission payment collected
   * Soll: 1200 Bank / Haben: 8400 Provisionserlöse
   */
  async bookCommissionReceived(commissionId: string, amount: number, paymentDate: Date, userId: string) {
    return await this.createBooking({
      debitAccountNumber: '1200',  // Bank
      creditAccountNumber: '8400', // Provisionserlöse
      amount,
      description: `Provisionseingang Buchung #${commissionId}`,
      bookingDate: paymentDate,
      sourceType: 'COMMISSION',
      sourceId: commissionId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: Commission payment to workshop
   * Soll: 4650 Provisionsaufwand / Haben: 1200 Bank
   */
  async bookCommissionPaid(commissionId: string, amount: number, paymentDate: Date, userId: string) {
    return await this.createBooking({
      debitAccountNumber: '4650', // Provisionsaufwand
      creditAccountNumber: '1200', // Bank
      amount,
      description: `Provisionszahlung an Werkstatt #${commissionId}`,
      bookingDate: paymentDate,
      sourceType: 'COMMISSION',
      sourceId: commissionId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: Employee expense approved
   * Soll: 4670 Reisekosten Fahrtkosten / Haben: 3300 Verbindlichkeiten
   */
  async bookTravelExpense(expenseId: string, amount: number, expenseDate: Date, userId: string, description: string) {
    return await this.createBooking({
      debitAccountNumber: '4670', // Reisekosten Fahrtkosten
      creditAccountNumber: '3300', // Verbindlichkeiten aus L+L
      amount,
      description: `Reisekosten: ${description}`,
      bookingDate: expenseDate,
      sourceType: 'TRAVEL_EXPENSE',
      sourceId: expenseId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: General employee expense approved
   * Soll: 6520 Bürobedarf / Haben: 3300 Verbindlichkeiten
   */
  async bookGeneralExpense(expenseId: string, amount: number, expenseDate: Date, userId: string, description: string) {
    return await this.createBooking({
      debitAccountNumber: '6520', // Bürobedarf
      creditAccountNumber: '3300', // Verbindlichkeiten
      amount,
      description: `Spesen: ${description}`,
      bookingDate: expenseDate,
      sourceType: 'EXPENSE',
      sourceId: expenseId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: Expense payment to employee
   * Soll: 3300 Verbindlichkeiten / Haben: 1200 Bank
   */
  async bookExpensePaid(expenseId: string, amount: number, paymentDate: Date, userId: string) {
    return await this.createBooking({
      debitAccountNumber: '3300', // Verbindlichkeiten
      creditAccountNumber: '1200', // Bank
      amount,
      description: `Spesenerstattung #${expenseId}`,
      bookingDate: paymentDate,
      sourceType: 'EXPENSE',
      sourceId: expenseId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: Influencer payment
   * Soll: 4650 Provisionsaufwand / Haben: 1200 Bank
   */
  async bookInfluencerPayment(paymentId: string, amount: number, paymentDate: Date, userId: string, influencerName: string) {
    return await this.createBooking({
      debitAccountNumber: '4650', // Provisionsaufwand
      creditAccountNumber: '1200', // Bank
      amount,
      description: `Influencer-Auszahlung: ${influencerName}`,
      bookingDate: paymentDate,
      sourceType: 'INFLUENCER',
      sourceId: paymentId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: Vehicle costs (fuel, maintenance, etc.)
   * Soll: 6300 Kfz-Kosten / Haben: 1200 Bank or 3300 Verbindlichkeiten
   */
  async bookVehicleCost(costId: string, amount: number, costDate: Date, userId: string, description: string, isPaid: boolean = true) {
    return await this.createBooking({
      debitAccountNumber: '6300', // Kfz-Kosten
      creditAccountNumber: isPaid ? '1200' : '3300', // Bank or Verbindlichkeiten
      amount,
      description: `Kfz-Kosten: ${description}`,
      bookingDate: costDate,
      sourceType: 'VEHICLE',
      sourceId: costId,
      createdByUserId: userId
    })
  }

  /**
   * AUTO-BOOKING: Payroll (simplified - real payroll booking is more complex with taxes, social security, etc.)
   * Soll: 4120 Löhne und Gehälter / Haben: 1200 Bank
   */
  async bookPayroll(payrollId: string, grossAmount: number, netAmount: number, paymentDate: Date, userId: string, employeeName: string) {
    // Book gross salary
    const grossEntry = await this.createBooking({
      debitAccountNumber: '4120', // Löhne und Gehälter
      creditAccountNumber: '3100', // Privatentnahmen (temporary account for payroll)
      amount: grossAmount,
      description: `Gehalt ${employeeName}`,
      bookingDate: paymentDate,
      sourceType: 'PAYROLL',
      sourceId: payrollId,
      createdByUserId: userId
    })

    // Book net payment
    const netEntry = await this.createBooking({
      debitAccountNumber: '3100', // Privatentnahmen
      creditAccountNumber: '1200', // Bank
      amount: netAmount,
      description: `Gehaltszahlung ${employeeName}`,
      bookingDate: paymentDate,
      sourceType: 'PAYROLL',
      sourceId: payrollId,
      createdByUserId: userId
    })

    return { grossEntry, netEntry }
  }
}

// Export singleton instance
export const bookingService = new AccountingBookingService()
