import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/workshop/services/[id] - Update a service
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: true
      }
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify service belongs to this workshop
    const service = await prisma.workshopService.findUnique({
      where: { id: id }
    })

    if (!service || service.workshopId !== user.workshop.id) {
      return NextResponse.json(
        { error: 'Service nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      basePrice,
      basePrice4,
      runFlatSurcharge,
      disposalFee,
      wheelSizeSurcharge,
      balancingPrice,
      storagePrice,
      durationMinutes,
      durationMinutes4,
      balancingMinutes,
      storageAvailable,
      refrigerantPrice,
      description,
      internalNotes,
      isActive,
      packages
    } = body

    // Handle package updates if provided
    if (packages !== undefined) {
      // Delete existing packages
      await prisma.servicePackage.deleteMany({
        where: { workshopServiceId: id }
      })

      // Create new packages if any
      if (packages && packages.length > 0) {
        await prisma.servicePackage.createMany({
          data: packages.map((pkg: any) => ({
            workshopServiceId: id,
            packageType: pkg.packageType,
            name: pkg.name,
            description: pkg.description || null,
            price: parseFloat(pkg.price),
            durationMinutes: parseInt(pkg.durationMinutes),
            isActive: pkg.isActive !== undefined ? pkg.isActive : true
          }))
        })
      }
    }

    const updatedService = await prisma.workshopService.update({
      where: { id: id },
      data: {
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
        basePrice4: basePrice4 !== undefined ? (basePrice4 ? parseFloat(basePrice4) : null) : undefined,
        runFlatSurcharge: runFlatSurcharge !== undefined ? (runFlatSurcharge ? parseFloat(runFlatSurcharge) : null) : undefined,
        disposalFee: disposalFee !== undefined ? (disposalFee ? parseFloat(disposalFee) : null) : undefined,
        wheelSizeSurcharge: wheelSizeSurcharge !== undefined ? wheelSizeSurcharge : undefined,
        balancingPrice: balancingPrice !== undefined ? (balancingPrice ? parseFloat(balancingPrice) : null) : undefined,
        storagePrice: storagePrice !== undefined ? (storagePrice ? parseFloat(storagePrice) : null) : undefined,
        refrigerantPricePer100ml: refrigerantPrice !== undefined ? (refrigerantPrice ? parseFloat(refrigerantPrice) : null) : undefined,
        durationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes) : undefined,
        durationMinutes4: durationMinutes4 !== undefined ? (durationMinutes4 ? parseInt(durationMinutes4) : null) : undefined,
        balancingMinutes: balancingMinutes !== undefined ? (balancingMinutes ? parseInt(balancingMinutes) : null) : undefined,
        storageAvailable: storageAvailable !== undefined ? storageAvailable : undefined,
        description: description !== undefined ? description : undefined,
        internalNotes: internalNotes !== undefined ? internalNotes : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: {
        servicePackages: true
      }
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Service update error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Services' },
      { status: 500 }
    )
  }
}

// DELETE /api/workshop/services/[id] - Delete a service
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: true
      }
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify service belongs to this workshop
    const service = await prisma.workshopService.findUnique({
      where: { id: id }
    })

    if (!service || service.workshopId !== user.workshop.id) {
      return NextResponse.json(
        { error: 'Service nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.workshopService.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Service delete error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Services' },
      { status: 500 }
    )
  }
}
