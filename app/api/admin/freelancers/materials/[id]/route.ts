import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

// PUT /api/admin/freelancers/materials/[id] - Update material
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const existing = await prisma.freelancerMaterial.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Material nicht gefunden' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const category = formData.get('category') as string
  const version = formData.get('version') as string | null
  const isActive = formData.get('isActive')

  const updateData: any = {}
  if (title) updateData.title = title
  if (description !== null) updateData.description = description || null
  if (category) updateData.category = category
  if (version) updateData.version = version
  if (isActive !== null) updateData.isActive = isActive === 'true'

  // If new file uploaded, replace the old one
  if (file) {
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei ist zu groß (max. 20MB)' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'freelancer-materials')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Delete old file
    try {
      const oldFilePath = path.join(process.cwd(), 'public', existing.fileUrl)
      await fs.unlink(oldFilePath)
    } catch {}

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueName = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadsDir, uniqueName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    updateData.fileUrl = `/uploads/freelancer-materials/${uniqueName}`
    updateData.fileName = file.name
    updateData.fileSize = file.size
  }

  const material = await prisma.freelancerMaterial.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({ material })
}

// DELETE /api/admin/freelancers/materials/[id] - Delete material
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const existing = await prisma.freelancerMaterial.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Material nicht gefunden' }, { status: 404 })
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), 'public', existing.fileUrl)
    await fs.unlink(filePath)
  } catch {}

  await prisma.freelancerMaterial.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
