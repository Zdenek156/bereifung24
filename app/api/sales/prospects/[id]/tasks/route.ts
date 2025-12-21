import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST - Create Task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'b24_employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, priority, assignedToId } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    const task = await prisma.prospectTask.create({
      data: {
        prospectId: params.id,
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        assignedToId: assignedToId || session.user.id,
        createdById: session.user.id,
        status: 'TODO'
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
