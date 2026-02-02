import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/customers - Get all customers for workshop
export async function GET(request: NextRequest) {
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

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const source = searchParams.get('source')

    // Build where clause
    const where: any = {
      workshopId: user.workshop.id,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (source && source !== 'ALL') {
      where.source = source
    }

    // Fetch customers
    const customers = await prisma.workshopCustomer.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        customerType: true,
        firstName: true,
        lastName: true,
        companyName: true,
        email: true,
        phone: true,
        mobile: true,
        city: true,
        zipCode: true,
        totalBookings: true,
        totalRevenue: true,
        lastBookingDate: true,
        firstBookingDate: true,
        averageRating: true,
        source: true,
        tags: true,
        segment: true,
        importance: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      customers,
      total: customers.length,
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST /api/workshop/customers - Create new customer
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Create customer
    const customer = await prisma.workshopCustomer.create({
      data: {
        workshopId: user.workshop.id,
        customerType: body.customerType || 'PRIVATE',
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
        country: body.country || 'Deutschland',
        tags: body.tags ? JSON.stringify(body.tags) : null,
        segment: body.segment,
        importance: body.importance || 'NORMAL',
        source: 'MANUAL',
        notes: body.notes,
        emailNotifications: body.emailNotifications ?? true,
        smsNotifications: body.smsNotifications ?? false,
        marketingConsent: body.marketingConsent ?? false,
        marketingConsentDate: body.marketingConsent ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      customer,
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
