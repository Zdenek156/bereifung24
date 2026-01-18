import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/accounting/settings - Get settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create default settings
    let settings = await prisma.accountingSetting.findFirst()

    if (!settings) {
      // Create default settings
      settings = await prisma.accountingSetting.create({
        data: {
          fiscalYearStart: 1, // January
          entryNumberCounter: 0,
          defaultVatRate: 19,
          reducedVatRate: 7,
          preferredExportFormat: 'DATEV'
        }
      })
    }

    // Load company tax number from CompanySettings
    const companySettings = await prisma.companySettings.findFirst()
    const companyTaxNumber = companySettings?.taxNumber || null

    return NextResponse.json({ 
      settings: {
        ...settings,
        companyTaxNumber
      }
    })
  } catch (error) {
    console.error('Error fetching accounting settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' },
      { status: 500 }
    )
  }
}

// POST /api/admin/accounting/settings - Update settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      fiscalYearStart,
      companyTaxNumber,
      defaultVatRate,
      reducedVatRate,
      preferredExportFormat
    } = body

    // Validate fiscal year
    if (fiscalYearStart < 1 || fiscalYearStart > 12) {
      return NextResponse.json(
        { error: 'Ungültiger Geschäftsjahr-Monat' },
        { status: 400 }
      )
    }

    // Validate VAT rates
    if (defaultVatRate < 0 || defaultVatRate > 100 || reducedVatRate < 0 || reducedVatRate > 100) {
      return NextResponse.json(
        { error: 'Ungültige Steuersätze' },
        { status: 400 }
      )
    }

    // Get existing settings or create new
    let settings = await prisma.accountingSetting.findFirst()

    if (settings) {
      // Update existing
      settings = await prisma.accountingSetting.update({
        where: { id: settings.id },
        data: {
          fiscalYearStart,
          defaultVatRate,
          reducedVatRate,
          preferredExportFormat: preferredExportFormat || 'DATEV'
        }
      })
    } else {
      // Create new
      settings = await prisma.accountingSetting.create({
        data: {
          fiscalYearStart,
          entryNumberCounter: 0,
          defaultVatRate,
          reducedVatRate,
          preferredExportFormat: preferredExportFormat || 'DATEV'
        }
      })
    }

    // Update company tax number in CompanySettings
    const existingCompany = await prisma.companySettings.findFirst()
    if (existingCompany) {
      await prisma.companySettings.update({
        where: { id: existingCompany.id },
        data: { taxNumber: companyTaxNumber || null }
      })
    } else {
      await prisma.companySettings.create({
        data: {
          companyName: 'Bereifung24 GmbH',
          taxNumber: companyTaxNumber || null
        }
      })
    }

    console.log(`✅ Accounting settings updated by ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      settings: {
        ...settings,
        companyTaxNumber
      }
    })
  } catch (error: any) {
    console.error('Error updating accounting settings:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}
