import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true }
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const workshopId = user.workshop.id

    // Find TIRE_CHANGE service
    const tireChangeService = await prisma.workshopService.findFirst({
      where: {
        workshopId: workshopId,
        serviceType: 'TIRE_CHANGE'
      },
      include: {
        servicePackages: true
      }
    })

    if (!tireChangeService) {
      return NextResponse.json({ 
        success: false,
        message: 'Kein Reifenwechsel-Service gefunden' 
      })
    }

    // Delete all packages first
    await prisma.servicePackage.deleteMany({
      where: {
        workshopServiceId: tireChangeService.id
      }
    })

    // Delete the service
    await prisma.workshopService.delete({
      where: {
        id: tireChangeService.id
      }
    })

    return NextResponse.json({ 
      success: true,
      deletedPackages: tireChangeService.servicePackages.length,
      message: `Reifenwechsel-Service mit ${tireChangeService.servicePackages.length} Paketen gelöscht. Bitte erstelle ihn neu!`
    })
  } catch (error) {
    console.error('Error deleting tire change service:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete service',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
