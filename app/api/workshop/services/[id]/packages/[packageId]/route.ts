import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/workshop/services/[id]/packages/[packageId] - Update a package
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  try {
    const { id, packageId } = await params
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

    // Verify package belongs to this service
    const packageExists = await prisma.servicePackage.findUnique({
      where: { id: packageId }
    })

    if (!packageExists || packageExists.workshopServiceId !== id) {
      return NextResponse.json(
        { error: 'Paket nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { price, durationMinutes, isActive, name, description } = body

    const updatedPackage = await prisma.servicePackage.update({
      where: { id: packageId },
      data: {
        price: price !== undefined ? parseFloat(price) : undefined,
        durationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined
      }
    })

    return NextResponse.json(updatedPackage)
  } catch (error) {
    console.error('Package update error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Pakets' },
      { status: 500 }
    )
  }
}

// DELETE /api/workshop/services/[id]/packages/[packageId] - Delete a package
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  try {
    const { id, packageId } = await params
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

    // Verify package belongs to this service
    const packageExists = await prisma.servicePackage.findUnique({
      where: { id: packageId }
    })

    if (!packageExists || packageExists.workshopServiceId !== id) {
      return NextResponse.json(
        { error: 'Paket nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.servicePackage.delete({
      where: { id: packageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Package deletion error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Pakets' },
      { status: 500 }
    )
  }
}
