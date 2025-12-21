import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';

// POST - Create Interaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
        createdById: employee.id
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
