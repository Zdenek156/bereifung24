import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST - Create Interaction
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
    const { type, notes, outcome, channel, duration, scheduledFor } = body;

    if (!type || !notes) {
      return NextResponse.json(
        { error: 'Type and notes are required' },
        { status: 400 }
      );
    }

    // Create interaction
    const interaction = await prisma.prospectInteraction.create({
      data: {
        prospectId: params.id,
        type,
        notes,
        outcome,
        channel,
        duration: duration ? parseInt(duration) : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update prospect's lastContactDate
    await prisma.prospectWorkshop.update({
      where: { id: params.id },
      data: { lastContactDate: new Date() }
    });

    return NextResponse.json({ interaction });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
