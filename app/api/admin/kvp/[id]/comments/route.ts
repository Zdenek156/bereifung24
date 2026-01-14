import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// POST - Add comment to suggestion
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    if (!session?.user?.b24EmployeeId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const comment = await prisma.improvementComment.create({
      data: {
        suggestionId: params.id,
        content: content.trim(),
        authorId: session.user.b24EmployeeId,
        isStatusNote: false
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Get suggestion details for notification
    const suggestion = await prisma.improvementSuggestion.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        submittedById: true,
        assignedToId: true
      }
    })

    // Send notification to submitter and assignee
    if (suggestion) {
      const { notifyNewComment } = await import('@/lib/kvp-notifications')
      notifyNewComment({
        suggestionId: params.id,
        suggestionTitle: suggestion.title,
        commentText: content.trim(),
        authorName: `${comment.author.firstName} ${comment.author.lastName}`,
        submitterId: suggestion.submittedById,
        assigneeId: suggestion.assignedToId
      }).catch(err => console.error('Failed to send notification:', err))
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
