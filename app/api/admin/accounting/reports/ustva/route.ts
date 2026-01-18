// app/api/admin/accounting/reports/ustva/route.ts
// Umsatzsteuer-Voranmeldung (UStVA)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    // Get all entries in the period
    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      select: {
        debitAccount: true,
        creditAccount: true,
        amount: true,
        vatRate: true,
        vatAmount: true,
        netAmount: true,
        description: true,
        bookingDate: true
      }
    })

    // UStVA Categories (Kennzahlen)
    const ustva = {
      // Zeile 20: Umsatzsteuerpflichtige Umsätze zu 19%
      line20_base: 0, // Bemessungsgrundlage (netto)
      line20_vat: 0,  // Umsatzsteuer 19%

      // Zeile 21: Umsatzsteuerpflichtige Umsätze zu 7%
      line21_base: 0,
      line21_vat: 0,

      // Zeile 22: Umsatzsteuerpflichtige Umsätze zu anderen Steuersätzen
      line22_base: 0,
      line22_vat: 0,

      // Zeile 23: Steuerfreie Umsätze
      line23_taxFree: 0,

      // Vorsteuer (Zeile 66-69)
      line66_inputVat: 0, // Vorsteuer aus Eingangsleistungen

      // Berechnung
      totalOutputVat: 0, // Umsatzsteuer gesamt
      totalInputVat: 0,  // Vorsteuer gesamt
      difference: 0,     // Zahllast (+) oder Erstattung (-)
    }

    // Process entries
    entries.forEach(entry => {
      const amount = entry.amount.toNumber()
      const vatAmount = entry.vatAmount?.toNumber() || 0
      const netAmount = entry.netAmount?.toNumber() || 0
      const vatRate = entry.vatRate || 0

      // Output VAT (Umsatzsteuer) - Revenue accounts (8xxx on credit side)
      if (entry.creditAccount.startsWith('8')) {
        if (vatRate === 19) {
          ustva.line20_base += netAmount
          ustva.line20_vat += vatAmount
        } else if (vatRate === 7) {
          ustva.line21_base += netAmount
          ustva.line21_vat += vatAmount
        } else if (vatRate > 0) {
          ustva.line22_base += netAmount
          ustva.line22_vat += vatAmount
        } else {
          ustva.line23_taxFree += amount
        }
      }

      // Input VAT (Vorsteuer) - Expense accounts (4xxx, 6xxx on debit side)
      if ((entry.debitAccount.startsWith('4') || entry.debitAccount.startsWith('6')) && vatAmount > 0) {
        ustva.line66_inputVat += vatAmount
      }
    })

    // Calculate totals
    ustva.totalOutputVat = ustva.line20_vat + ustva.line21_vat + ustva.line22_vat
    ustva.totalInputVat = ustva.line66_inputVat
    ustva.difference = ustva.totalOutputVat - ustva.totalInputVat

    // Summary
    const summary = {
      period: {
        startDate,
        endDate
      },
      ustva,
      taxPayable: ustva.difference > 0 ? ustva.difference : 0,
      taxRefund: ustva.difference < 0 ? Math.abs(ustva.difference) : 0
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Error generating UStVA:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
