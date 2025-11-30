import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const pages = await prisma.workshopLandingPage.findMany({
      select: {
        id: true,
        slug: true,
        isActive: true,
        metaTitle: true,
        workshopId: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({ pages, count: pages.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
