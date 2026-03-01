import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/support/settings
 * Load support email credentials from InvoiceSettings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' },
      select: { supportEmail: true, supportPassword: true },
    })

    return NextResponse.json({
      supportEmail: settings?.supportEmail || '',
      supportPassword: settings?.supportPassword ? '••••••••' : '',
      hasPassword: !!settings?.supportPassword,
    })
  } catch (error) {
    console.error('Error fetching support settings:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/support/settings
 * Save support email credentials to InvoiceSettings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supportEmail, supportPassword } = await request.json()

    if (!supportEmail) {
      return NextResponse.json({ error: 'Email-Adresse ist erforderlich' }, { status: 400 })
    }

    // Build update data – only update password if a new one was provided (not placeholder)
    const updateData: { supportEmail: string; supportPassword?: string } = { supportEmail }
    if (supportPassword && supportPassword !== '••••••••') {
      updateData.supportPassword = supportPassword
    }

    await prisma.invoiceSettings.upsert({
      where: { id: 'default-settings' },
      update: updateData,
      create: {
        id: 'default-settings',
        currentNumber: 1,
        prefix: 'B24-INV',
        companyName: 'Bereifung24 GmbH',
        website: 'www.bereifung24.de',
        companyCountry: 'Deutschland',
        ...updateData,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving support settings:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
