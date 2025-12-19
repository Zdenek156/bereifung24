import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create note
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
      category,
      title,
      content,
      isPinned,
      employeeName
    } = body

    if (!content || !employeeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const note = await prisma.workshopNote.create({
      data: {
        crmId: crm.id,
        category,
        title,
        content,
        isPinned: isPinned || false,
        employeeName,
        employeeId: session.user.id
      }
    })

    return NextResponse.json(note)

  } catch (error) {
    console.error('Note create error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

// PUT - Update note
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 })
    }

    const body = await req.json()
    const { category, title, content, isPinned } = body

    const note = await prisma.workshopNote.update({
      where: { id: noteId },
      data: {
        category,
        title,
        content,
        isPinned
      }
    })

    return NextResponse.json(note)

  } catch (error) {
    console.error('Note update error:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE - Delete note
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
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 })
    }

    await prisma.workshopNote.delete({
      where: { id: noteId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Note delete error:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
