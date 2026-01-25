import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/invoices/settings
 * Get invoice settings (company data, logo, etc.)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' }
    })

    // Create default if not exists
    if (!settings) {
      settings = await prisma.invoiceSettings.create({
        data: {
          id: 'default-settings',
          currentNumber: 1,
          prefix: 'B24-INV',
          companyName: 'Bereifung24 GmbH',
          website: 'www.bereifung24.de',
          companyCountry: 'Deutschland'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error fetching invoice settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/invoices/settings
 * Update invoice settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update settings
    const settings = await prisma.invoiceSettings.upsert({
      where: { id: 'default-settings' },
      update: {
        companyName: body.companyName,
        companyStreet: body.companyStreet,
        companyZip: body.companyZip,
        companyCity: body.companyCity,
        companyCountry: body.companyCountry,
        taxId: body.taxId,
        taxNumber: body.taxNumber,
        registerCourt: body.registerCourt,
        registerNumber: body.registerNumber,
        managingDirector: body.managingDirector,
        email: body.email,
        phone: body.phone,
        website: body.website,
        invoiceEmail: body.invoiceEmail,
        invoicePassword: body.invoicePassword,
        bankName: body.bankName,
        iban: body.iban,
        bic: body.bic,
        gocardlessCreditorId: body.gocardlessCreditorId,
        footerText: body.footerText
      },
      create: {
        id: 'default-settings',
        currentNumber: 1,
        prefix: 'B24-INV',
        companyName: body.companyName || 'Bereifung24 GmbH',
        companyStreet: body.companyStreet,
        companyZip: body.companyZip,
        companyCity: body.companyCity,
        companyCountry: body.companyCountry || 'Deutschland',
        taxId: body.taxId,
        taxNumber: body.taxNumber,
        registerCourt: body.registerCourt,
        registerNumber: body.registerNumber,
        managingDirector: body.managingDirector,
        email: body.email,
        phone: body.phone,
        website: body.website || 'www.bereifung24.de',
        invoiceEmail: body.invoiceEmail,
        invoicePassword: body.invoicePassword,
        bankName: body.bankName,
        iban: body.iban,
        bic: body.bic,
        gocardlessCreditorId: body.gocardlessCreditorId,
        footerText: body.footerText
      }
    })

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error updating invoice settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
