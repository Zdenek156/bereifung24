import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// PATCH - Support-Notiz hinzufügen
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { supportNotes } = await request.json()

    const updated = await prisma.deletedUserEmail.update({
      where: { id: params.id },
      data: { supportNotes }
    })

    return NextResponse.json(updated)

  } catch (error) {
    console.error('Error updating blacklist entry:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Notiz' },
      { status: 500 }
    )
  }
}

// DELETE - E-Mail freischalten (aus Blacklist entfernen)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Nur ADMIN darf freischalten
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nur Administratoren können E-Mails freischalten' },
        { status: 403 }
      )
    }

    await prisma.deletedUserEmail.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'E-Mail-Adresse wurde freigeschaltet' 
    })

  } catch (error) {
    console.error('Error unlocking email:', error)
    return NextResponse.json(
      { error: 'Fehler beim Freischalten der E-Mail' },
      { status: 500 }
    )
  }
}
