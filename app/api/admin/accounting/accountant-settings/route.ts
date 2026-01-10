import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/accounting/accountant-settings
 * Get accountant contact information
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get from CompanySettings first
    const companySettings = await prisma.companySettings.findFirst()
    
    if (companySettings) {
      return NextResponse.json({
        success: true,
        data: {
          name: companySettings.accountantName || '',
          email: companySettings.accountantEmail || '',
          company: companySettings.accountantCompany || '',
          address: companySettings.accountantAddress || '',
          phone: companySettings.accountantPhone || '',
          taxNumber: companySettings.accountantTaxNumber || ''
        }
      })
    }

    // Return empty settings if not found
    return NextResponse.json({
      success: true,
      data: {
        name: '',
        email: '',
        company: '',
        address: '',
        phone: '',
        taxNumber: ''
      }
    })
  } catch (error) {
    console.error('[ACCOUNTANT SETTINGS] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Einstellungen'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/accounting/accountant-settings
 * Save accountant contact information
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, company, address, phone, taxNumber } = body

    // Validation
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email ist erforderlich'
      }, { status: 400 })
    }

    // Check if company settings exist
    const existing = await prisma.companySettings.findFirst()

    if (existing) {
      // Update existing
      await prisma.companySettings.update({
        where: { id: existing.id },
        data: {
          accountantName: name,
          accountantEmail: email,
          accountantCompany: company,
          accountantAddress: address,
          accountantPhone: phone,
          accountantTaxNumber: taxNumber,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new
      await prisma.companySettings.create({
        data: {
          companyName: 'Bereifung24 GmbH',
          accountantName: name,
          accountantEmail: email,
          accountantCompany: company,
          accountantAddress: address,
          accountantPhone: phone,
          accountantTaxNumber: taxNumber
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Steuerberater-Einstellungen gespeichert'
    })
  } catch (error) {
    console.error('[ACCOUNTANT SETTINGS] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Speichern der Einstellungen'
    }, { status: 500 })
  }
}
