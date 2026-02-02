import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Get customer (without relations for now to avoid DB column issues)
    const customer = await prisma.workshopCustomer.findFirst({
      where: {
        id: params.id,
        workshopId: user.workshop.id,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      customer,
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

// PUT /api/workshop/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Check if customer exists and belongs to workshop
    const existingCustomer = await prisma.workshopCustomer.findFirst({
      where: {
        id: params.id,
        workshopId: user.workshop.id,
      },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const body = await request.json()

    // Update customer
    const customer = await prisma.workshopCustomer.update({
      where: { id: params.id },
      data: {
        customerType: body.customerType,
        salutation: body.salutation,
        firstName: body.firstName,
        lastName: body.lastName,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        mobile: body.mobile,
        fax: body.fax,
        website: body.website,
        street: body.street,
        zipCode: body.zipCode,
        city: body.city,
        country: body.country,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        segment: body.segment,
        importance: body.importance,
        notes: body.notes,
        emailNotifications: body.emailNotifications,
        smsNotifications: body.smsNotifications,
        marketingConsent: body.marketingConsent,
        marketingConsentDate: body.marketingConsent ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      customer,
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE /api/workshop/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true },
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Check if customer exists and belongs to workshop
    const existingCustomer = await prisma.workshopCustomer.findFirst({
      where: {
        id: params.id,
        workshopId: user.workshop.id,
      },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Delete customer (cascade will delete related records)
    await prisma.workshopCustomer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
