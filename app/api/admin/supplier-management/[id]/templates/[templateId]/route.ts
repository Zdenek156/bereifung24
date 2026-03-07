import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/admin/supplier-management/[id]/templates/[templateId] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, subject, bodyHtml, description, isActive } = body

    const template = await prisma.supplierEmailTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(name !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(bodyHtml !== undefined && { bodyHtml }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('❌ [Supplier Management] Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE /api/admin/supplier-management/[id]/templates/[templateId] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await prisma.supplierEmailTemplate.delete({ where: { id: params.templateId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [Supplier Management] Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
