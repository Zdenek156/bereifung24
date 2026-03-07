import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/materials/[id]/download - Download material and track
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const material = await prisma.freelancerMaterial.findFirst({
    where: { id: params.id, isActive: true },
  })

  if (!material) {
    return NextResponse.json({ error: 'Material nicht gefunden' }, { status: 404 })
  }

  // Track download
  await prisma.freelancerMaterialDownload.create({
    data: {
      materialId: material.id,
      freelancerId: freelancer.id,
    }
  })

  // Return file URL for client to download
  return NextResponse.json({
    fileUrl: material.fileUrl,
    fileName: material.fileName,
  })
}
