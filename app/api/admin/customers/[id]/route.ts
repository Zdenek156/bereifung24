import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isActive } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive }
    })

    return NextResponse.json({ success: true, user: updatedUser })

  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lösche den Benutzer und alle zugehörigen Daten (durch Cascade in Prisma Schema)
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Kunde erfolgreich gelöscht' })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Kunden' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
