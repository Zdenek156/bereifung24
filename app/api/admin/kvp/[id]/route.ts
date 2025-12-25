import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// GET - Get single suggestion
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requirePermission('kvp', 'read')
    if (permissionError) return permissionError

    const suggestion = await prisma.improvementSuggestion.findUnique({
      where: { id: params.id },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Error fetching suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestion' },
      { status: 500 }
    )
  }
}

// PUT - Update suggestion
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requirePermission('kvp', 'write')
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    const body = await request.json()
    const {
      title,
      description,
      category,
      priority,
      status,
      estimatedEffort,
      plannedDate,
      completedDate,
      assignedToId,
      statusNote
    } = body

    // Get current suggestion to check for status change
    const currentSuggestion = await prisma.improvementSuggestion.findUnique({
      where: { id: params.id }
    })

    if (!currentSuggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Update suggestion
    const suggestion = await prisma.improvementSuggestion.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(estimatedEffort !== undefined && { estimatedEffort }),
        ...(plannedDate !== undefined && {
          plannedDate: plannedDate ? new Date(plannedDate) : null
        }),
        ...(completedDate !== undefined && {
          completedDate: completedDate ? new Date(completedDate) : null
        }),
        ...(assignedToId !== undefined && { assignedToId })
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // If status changed, create a system comment
    if (status && status !== currentSuggestion.status && session?.user?.b24EmployeeId) {
      const statusMessages: Record<string, string> = {
        NEW: 'Status auf "Neu" gesetzt',
        IN_REVIEW: 'Status auf "In Prüfung" gesetzt',
        APPROVED: 'Status auf "Genehmigt" gesetzt',
        IN_PROGRESS: 'Status auf "In Umsetzung" gesetzt',
        COMPLETED: 'Status auf "Abgeschlossen" gesetzt',
        REJECTED: 'Status auf "Abgelehnt" gesetzt',
        ON_HOLD: 'Status auf "Zurückgestellt" gesetzt'
      }

      await prisma.improvementComment.create({
        data: {
          suggestionId: params.id,
          content: statusNote || statusMessages[status] || `Status geändert zu ${status}`,
          isStatusNote: true,
          authorId: session.user.b24EmployeeId
        }
      })

      // TODO: Send notification to submitter and assignee
    }

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Error updating suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    )
  }
}

// DELETE - Delete suggestion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requirePermission('kvp', 'delete')
    if (permissionError) return permissionError

    await prisma.improvementSuggestion.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    )
  }
}
