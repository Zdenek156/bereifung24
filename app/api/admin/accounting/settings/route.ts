import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/accounting/settings - Get settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
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

    return NextResponse.json({ settings })
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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      fiscalYearStart,
      taxAdvisorName,
      taxAdvisorEmail,
      taxAdvisorPhone,
      taxAdvisorCompany,
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
          taxAdvisorName: taxAdvisorName || null,
          taxAdvisorEmail: taxAdvisorEmail || null,
          taxAdvisorPhone: taxAdvisorPhone || null,
          taxAdvisorCompany: taxAdvisorCompany || null,
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
          taxAdvisorName: taxAdvisorName || null,
          taxAdvisorEmail: taxAdvisorEmail || null,
          taxAdvisorPhone: taxAdvisorPhone || null,
          taxAdvisorCompany: taxAdvisorCompany || null,
          defaultVatRate,
          reducedVatRate,
          preferredExportFormat: preferredExportFormat || 'DATEV'
        }
      })
    }

    console.log(`✅ Accounting settings updated by ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      settings 
    })
  } catch (error: any) {
    console.error('Error updating accounting settings:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}
