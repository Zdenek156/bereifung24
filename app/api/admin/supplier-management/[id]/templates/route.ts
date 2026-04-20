import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/supplier-management/[id]/templates - Create email template
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
    const { name, subject, bodyHtml, description, isActive } = body

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Name, Betreff und Inhalt sind erforderlich' }, { status: 400 })
    }

    const template = await prisma.supplierEmailTemplate.create({
      data: {
        supplierId: params.id,
        name,
        subject,
        bodyHtml,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('❌ [Supplier Management] Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
