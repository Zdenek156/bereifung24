import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/supplier-management - List all suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const suppliers = await prisma.supplierManagement.findMany({
      orderBy: { companyName: 'asc' },
      include: {
        _count: {
          select: {
            contacts: true,
            emailTemplates: true,
          },
        },
        apiConfig: {
          select: { apiMode: true },
        },
        referralProgram: {
          select: { isActive: true },
        },
      },
    })

    // Count workshop connections per supplier code
    const workshopCounts = await prisma.workshopSupplier.groupBy({
      by: ['supplier'],
      _count: { id: true },
    })
    const workshopCountMap = Object.fromEntries(
      workshopCounts.map(wc => [wc.supplier, wc._count.id])
    )

    const result = suppliers.map(s => ({
      ...s,
      workshopCount: workshopCountMap[s.code] || 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ [Supplier Management] Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST /api/admin/supplier-management - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { code, companyName, legalForm, category, website, street, zipCode, city, country, phone, email, taxId, customerNumber, notes } = body

    if (!code || !companyName) {
      return NextResponse.json({ error: 'Code und Firmenname sind erforderlich' }, { status: 400 })
    }

    const existing = await prisma.supplierManagement.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Ein Lieferant mit diesem Code existiert bereits' }, { status: 409 })
    }

    const supplier = await prisma.supplierManagement.create({
      data: {
        code: code.toUpperCase(),
        companyName,
        legalForm: legalForm || null,
        category: category || 'SONSTIGES',
        website: website || null,
        street: street || null,
        zipCode: zipCode || null,
        city: city || null,
        country: country || 'Deutschland',
        phone: phone || null,
        email: email || null,
        taxId: taxId || null,
        customerNumber: customerNumber || null,
        notes: notes || null,
        // Auto-create empty apiConfig and referralProgram
        apiConfig: { create: {} },
        referralProgram: { create: {} },
      },
      include: {
        contacts: true,
        apiConfig: true,
        referralProgram: true,
        emailTemplates: true,
      },
    })

    console.log(`✅ [Supplier Management] Created: ${supplier.code} (${supplier.companyName})`)
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('❌ [Supplier Management] Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
