import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/vehicles/cleanup - Delete all vehicles (admin only)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Delete all vehicles
    const result = await prisma.vehicle.deleteMany({})

    return NextResponse.json({ 
      success: true,
      message: `${result.count} Fahrzeuge wurden gelöscht`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('DELETE /api/admin/vehicles/cleanup error:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}
