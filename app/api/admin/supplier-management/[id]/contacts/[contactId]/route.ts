import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/admin/supplier-management/[id]/contacts/[contactId] - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Access required' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, position, purposes, isPrimary, notes } = body

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId: params.id, isPrimary: true, id: { not: params.contactId } },
        data: { isPrimary: false },
      })
    }

    const contact = await prisma.supplierContact.update({
      where: { id: params.contactId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(position !== undefined && { position: position || null }),
        ...(purposes !== undefined && { purposes }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('❌ [Supplier Management] Error updating contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE /api/admin/supplier-management/[id]/contacts/[contactId] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Access required' }, { status: 403 })
    }

    await prisma.supplierContact.delete({ where: { id: params.contactId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [Supplier Management] Error deleting contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
