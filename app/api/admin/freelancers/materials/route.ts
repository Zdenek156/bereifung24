import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

// GET /api/admin/freelancers/materials - List all materials
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const materials = await prisma.freelancerMaterial.findMany({
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { downloads: true } },
    },
  })

  return NextResponse.json({ materials })
}

// POST /api/admin/freelancers/materials - Upload new material
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const category = formData.get('category') as string
  const version = (formData.get('version') as string) || '1.0'

  if (!title || !category) {
    return NextResponse.json({ error: 'Titel und Kategorie sind erforderlich' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
  }

  // Validate file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei ist zu groß (max. 20MB)' }, { status: 400 })
  }

  // Create uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'freelancer-materials')
  await fs.mkdir(uploadsDir, { recursive: true })

  // Generate unique filename
  const ext = path.extname(file.name)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const uniqueName = `${Date.now()}-${safeName}`
  const filePath = path.join(uploadsDir, uniqueName)

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  const fileUrl = `/uploads/freelancer-materials/${uniqueName}`

  const material = await prisma.freelancerMaterial.create({
    data: {
      title,
      description: description || null,
      category,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      version,
      isActive: true,
    },
  })

  return NextResponse.json({ material }, { status: 201 })
}
