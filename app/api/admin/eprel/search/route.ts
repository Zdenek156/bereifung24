import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Search parameters
    const supplierName = searchParams.get('supplier')
    const modelName = searchParams.get('model')
    const width = searchParams.get('width')
    const aspectRatio = searchParams.get('aspectRatio')
    const diameter = searchParams.get('diameter')
    const tyreClass = searchParams.get('tyreClass')
    const fuelEfficiency = searchParams.get('fuelEfficiency')
    const wetGrip = searchParams.get('wetGrip')
    const has3PMSF = searchParams.get('has3PMSF')
    const hasIceGrip = searchParams.get('hasIceGrip')
    const searchTerm = searchParams.get('q')
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (supplierName) {
      where.supplierName = { contains: supplierName, mode: 'insensitive' }
    }
    
    if (modelName) {
      where.modelName = { contains: modelName, mode: 'insensitive' }
    }
    
    if (width) {
      where.width = parseInt(width)
    }
    
    if (aspectRatio) {
      where.aspectRatio = parseInt(aspectRatio)
    }
    
    if (diameter) {
      where.diameter = parseInt(diameter)
    }
    
    if (tyreClass) {
      where.tyreClass = tyreClass
    }
    
    if (fuelEfficiency) {
      where.fuelEfficiencyClass = fuelEfficiency
    }
    
    if (wetGrip) {
      where.wetGripClass = wetGrip
    }
    
    if (has3PMSF === 'true') {
      where.has3PMSF = true
    }
    
    if (hasIceGrip === 'true') {
      where.hasIceGrip = true
    }
    
    // General search term (searches in supplier, model, and dimension)
    if (searchTerm) {
      where.OR = [
        { supplierName: { contains: searchTerm, mode: 'insensitive' } },
        { modelName: { contains: searchTerm, mode: 'insensitive' } },
        { tyreDimension: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
    
    // Get total count
    const total = await prisma.ePRELTire.count({ where })
    
    // Get tires with pagination
    const tires = await prisma.ePRELTire.findMany({
      where,
      orderBy: [
        { supplierName: 'asc' },
        { modelName: 'asc' },
        { width: 'asc' },
        { aspectRatio: 'asc' },
        { diameter: 'asc' }
      ],
      skip,
      take: limit,
      select: {
        id: true,
        eprelId: true,
        supplierName: true,
        modelName: true,
        tyreDimension: true,
        width: true,
        aspectRatio: true,
        diameter: true,
        loadIndex: true,
        speedRating: true,
        tyreClass: true,
        has3PMSF: true,
        hasIceGrip: true,
        fuelEfficiencyClass: true,
        wetGripClass: true,
        externalRollingNoiseLevel: true,
        externalRollingNoiseClass: true,
        importedAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: tires,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error searching EPREL tires:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Suchen der Reifen' },
      { status: 500 }
    )
  }
}
