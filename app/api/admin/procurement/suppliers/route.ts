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
