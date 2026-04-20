import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/supplier-management/[id] - Get supplier with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplier = await prisma.supplierManagement.findUnique({
      where: { id: params.id },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }] },
        apiConfig: true,
        referralProgram: true,
        emailTemplates: { orderBy: { name: 'asc' } },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Lieferant nicht gefunden' }, { status: 404 })
    }

    // Get workshop connections for this supplier code
    const workshopConnections = await prisma.workshopSupplier.findMany({
      where: { supplier: supplier.code },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                city: true,
                zipCode: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten workshop data for frontend
    const flatConnections = workshopConnections.map(wc => ({
      ...wc,
      workshop: {
        id: wc.workshop.id,
        companyName: wc.workshop.companyName,
        city: wc.workshop.user?.city || null,
        zipCode: wc.workshop.user?.zipCode || null,
      },
    }))

    return NextResponse.json({ ...supplier, workshopConnections: flatConnections })
  } catch (error) {
    console.error('❌ [Supplier Management] Error fetching supplier:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

// PUT /api/admin/supplier-management/[id] - Update supplier master data
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Access required' }, { status: 403 })
    }

    const body = await request.json()
    const { companyName, legalForm, category, website, street, zipCode, city, country, phone, email, taxId, customerNumber, notes, isActive } = body

    const supplier = await prisma.supplierManagement.update({
      where: { id: params.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(legalForm !== undefined && { legalForm: legalForm || null }),
        ...(category !== undefined && { category }),
        ...(website !== undefined && { website: website || null }),
        ...(street !== undefined && { street: street || null }),
        ...(zipCode !== undefined && { zipCode: zipCode || null }),
        ...(city !== undefined && { city: city || null }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(taxId !== undefined && { taxId: taxId || null }),
        ...(customerNumber !== undefined && { customerNumber: customerNumber || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    console.log(`✅ [Supplier Management] Updated: ${supplier.code}`)
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('❌ [Supplier Management] Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

// DELETE /api/admin/supplier-management/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Access required' }, { status: 403 })
    }

    const supplier = await prisma.supplierManagement.findUnique({ where: { id: params.id } })
    if (!supplier) {
      return NextResponse.json({ error: 'Lieferant nicht gefunden' }, { status: 404 })
    }

    // Check if workshops are connected
    const wsCount = await prisma.workshopSupplier.count({ where: { supplier: supplier.code } })
    if (wsCount > 0) {
      return NextResponse.json(
        { error: `Lieferant kann nicht gelöscht werden: ${wsCount} Werkstätten sind noch verbunden` },
        { status: 409 }
      )
    }

    await prisma.supplierManagement.delete({ where: { id: params.id } })
    console.log(`✅ [Supplier Management] Deleted: ${supplier.code}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [Supplier Management] Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
