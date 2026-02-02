import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/tire-requests/[id]/notes
 * Add admin note to tire request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { note, isImportant = false } = body

    if (!note || note.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Verify request exists
    const tireRequest = await prisma.tireRequest.findUnique({
      where: { id }
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Tire request not found' },
        { status: 404 }
      )
    }

    // Create note
    const adminNote = await prisma.tireRequestNote.create({
      data: {
        tireRequestId: id,
        userId: session.user.id,
        note: note.trim(),
        isImportant
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: adminNote
    })
  } catch (error) {
    console.error('Error creating admin note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/tire-requests/[id]/notes
 * Get all notes for a tire request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    const notes = await prisma.tireRequestNote.findMany({
      where: { tireRequestId: id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: notes
    })
  } catch (error) {
    console.error('Error fetching admin notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/tire-requests/[id]/notes
 * Delete a note (pass noteId in body)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { noteId } = body

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    // Verify note exists and belongs to this request
    const note = await prisma.tireRequestNote.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    if (note.tireRequestId !== params.id) {
      return NextResponse.json(
        { error: 'Note does not belong to this request' },
        { status: 400 }
      )
    }

    // Delete note
    await prisma.tireRequestNote.delete({
      where: { id: noteId }
    })

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting admin note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
