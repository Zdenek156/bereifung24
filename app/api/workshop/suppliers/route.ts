import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  upsertWorkshopSupplier,
  getWorkshopSuppliers,
  updateSupplierSettings,
  deleteSupplier,
} from '@/lib/services/workshopSupplierService'
import { clearWorkshopCache } from '@/lib/redis/cache'

/**
 * Workshop Suppliers Management API
 * 
 * GET    /api/workshop/suppliers - Get all suppliers
 * POST   /api/workshop/suppliers - Create/Update supplier
 * PATCH  /api/workshop/suppliers - Update supplier settings
 * DELETE /api/workshop/suppliers - Delete supplier
 */

// GET - Get all suppliers for workshop
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop for user
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const suppliers = await getWorkshopSuppliers(workshop.id)

    // Don't send encrypted credentials to frontend
    const safeSuppliers = suppliers.map((s) => ({
      id: s.id,
      supplier: s.supplier,
      name: s.name,
      isActive: s.isActive,
      autoOrder: s.autoOrder,
      priority: s.priority,
      lastApiCheck: s.lastApiCheck,
      lastApiError: s.lastApiError,
      apiCallsToday: s.apiCallsToday,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: safeSuppliers,
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST - Create or update supplier credentials
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const body = await request.json()
    const { supplier, name, username, password, isActive, autoOrder, priority } = body

    // Validation
    if (!supplier || !name) {
      return NextResponse.json(
        { error: 'Supplier and name are required' },
        { status: 400 }
      )
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Upsert supplier
    const result = await upsertWorkshopSupplier(
      workshop.id,
      supplier,
      name,
      { username, password },
      { isActive, autoOrder, priority }
    )

    // Clear cache for this workshop (credentials changed)
    await clearWorkshopCache(workshop.id)

    return NextResponse.json({
      success: true,
      message: 'Supplier credentials saved successfully',
      data: {
        id: result.id,
        supplier: result.supplier,
        name: result.name,
        isActive: result.isActive,
        autoOrder: result.autoOrder,
      },
    })
  } catch (error) {
    console.error('Error saving supplier:', error)
    return NextResponse.json(
      { error: 'Failed to save supplier credentials' },
      { status: 500 }
    )
  }
}

// PATCH - Update supplier settings (without changing credentials)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const body = await request.json()
    const { supplier, isActive, autoOrder, priority } = body

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier is required' },
        { status: 400 }
      )
    }

    const result = await updateSupplierSettings(workshop.id, supplier, {
      isActive,
      autoOrder,
      priority,
    })

    return NextResponse.json({
      success: true,
      message: 'Supplier settings updated',
      data: {
        id: result.id,
        supplier: result.supplier,
        isActive: result.isActive,
        autoOrder: result.autoOrder,
        priority: result.priority,
      },
    })
  } catch (error) {
    console.error('Error updating supplier settings:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier settings' },
      { status: 500 }
    )
  }
}

// DELETE - Delete supplier
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const supplier = searchParams.get('supplier')

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier parameter is required' },
        { status: 400 }
      )
    }

    await deleteSupplier(workshop.id, supplier)

    // Clear cache
    await clearWorkshopCache(workshop.id)

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
