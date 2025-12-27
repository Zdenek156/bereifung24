import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber, calculateVat, calculateGross } from '@/lib/procurement-utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        orderedBy: { select: { firstName: true, lastName: true } },
        items: true,
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let orderNumber = generateOrderNumber()
    
    // Ensure unique order number
    let exists = await prisma.purchaseOrder.findUnique({ where: { orderNumber } })
    while (exists) {
      orderNumber = generateOrderNumber()
      exists = await prisma.purchaseOrder.findUnique({ where: { orderNumber } })
    }

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: body.supplierId,
        orderedById: session.user.id,
        deliveryAddress: body.deliveryAddress,
        expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
        status: 'DRAFT',
        totalNet: body.totalNet,
        totalVat: body.totalVat,
        totalGross: body.totalGross,
        items: {
          create: body.items.map((item: any, index: number) => ({
            position: index + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'Stück',
            priceNet: item.priceNet,
            vatRate: item.vatRate,
            totalNet: item.totalNet,
            totalVat: item.totalVat,
            totalGross: item.totalGross
          }))
        }
      },
      include: {
        supplier: true,
        items: true
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
