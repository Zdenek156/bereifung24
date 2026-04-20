import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/supplier-management/[id]/contacts - Add contact
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Access required' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, position, purposes, isPrimary, notes } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Vor- und Nachname sind erforderlich' }, { status: 400 })
    }

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId: params.id, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const contact = await prisma.supplierContact.create({
      data: {
        supplierId: params.id,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        position: position || null,
        purposes: purposes || [],
        isPrimary: isPrimary || false,
        notes: notes || null,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('❌ [Supplier Management] Error creating contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
