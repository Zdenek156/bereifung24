import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create interaction
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshopId = params.id
    const body = await req.json()

    // Get or create CRM record first
    let crm = await prisma.workshopCRM.findUnique({
      where: { workshopId }
    })

    if (!crm) {
      crm = await prisma.workshopCRM.create({
        data: {
          workshopId,
          leadStatus: 'NEUKONTAKT'
        }
      })
    }

    const {
      type,
      date,
      duration,
      summary,
      outcome,
      employeeName
    } = body

    if (!type || !date || !summary || !employeeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const interaction = await prisma.workshopInteraction.create({
      data: {
        crmId: crm.id,
        type,
        date: new Date(date),
        duration,
        summary,
        outcome,
        employeeName,
        employeeId: session.user.id
      }
    })

    return NextResponse.json(interaction)

  } catch (error) {
    console.error('Interaction create error:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}

// DELETE - Delete interaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const interactionId = searchParams.get('interactionId')

    if (!interactionId) {
      return NextResponse.json({ error: 'Interaction ID required' }, { status: 400 })
    }

    await prisma.workshopInteraction.delete({
      where: { id: interactionId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Interaction delete error:', error)
    return NextResponse.json({ error: 'Failed to delete interaction' }, { status: 500 })
  }
}
