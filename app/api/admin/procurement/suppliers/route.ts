import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all suppliers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (category) where.categories = { has: category }
    if (isActive !== null) where.isActive = isActive === 'true'

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Extract only valid fields for Prisma schema
    const supplierData: any = {
      name: body.name,
      categories: body.categories || [],
      createdById: session.user.id
    }
    
    // Optional fields
    if (body.email) supplierData.email = body.email
    if (body.phone) supplierData.phone = body.phone
    if (body.website) supplierData.website = body.website
    if (body.address) supplierData.address = body.address
    if (body.zipCode) supplierData.zipCode = body.zipCode
    if (body.city) supplierData.city = body.city
    if (body.country) supplierData.country = body.country
    if (body.taxId) supplierData.taxId = body.taxId
    if (body.iban) supplierData.iban = body.iban
    if (body.paymentTerms) supplierData.paymentTerms = body.paymentTerms
    if (body.notes) supplierData.notes = body.notes
    
    const supplier = await prisma.supplier.create({
      data: supplierData
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}

// PUT - Update supplier
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Build update data - only include fields that are provided
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.website !== undefined) updateData.website = body.website
    if (body.categories !== undefined) updateData.categories = body.categories
    if (body.address !== undefined) updateData.address = body.address
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode
    if (body.city !== undefined) updateData.city = body.city
    if (body.country !== undefined) updateData.country = body.country
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.iban !== undefined) updateData.iban = body.iban
    if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}
