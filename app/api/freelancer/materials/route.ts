import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/materials - List available materials
export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const materials = await prisma.freelancerMaterial.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })

  // Get download counts for this freelancer
  const downloads = await prisma.freelancerMaterialDownload.findMany({
    where: { freelancerId: freelancer.id },
    select: { materialId: true, downloadedAt: true },
    orderBy: { downloadedAt: 'desc' },
  })

  const downloadMap = new Map<string, Date>()
  downloads.forEach(d => {
    if (!downloadMap.has(d.materialId)) {
      downloadMap.set(d.materialId, d.downloadedAt)
    }
  })

  return NextResponse.json({
    materials: materials.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      fileName: m.fileName,
      fileSize: m.fileSize,
      version: m.version,
      lastDownloaded: downloadMap.get(m.id) || null,
      updatedAt: m.updatedAt,
    })),
  })
}
