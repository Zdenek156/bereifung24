import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';

// GET - Prospect Details mit allen Relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        interactions: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
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
          },
          orderBy: { dueDate: 'asc' }
        },
        notes: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        convertedWorkshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                city: true
              }
            }
          }
        }
      }
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    return NextResponse.json({ prospect });
  } catch (error) {
    console.error('Error fetching prospect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update Prospect
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      website,
      email,
      status,
      priority,
      assignedToId,
      estimatedRevenue,
      lastContactDate,
      nextFollowUpDate,
      notes: noteText
    } = body;

    // Update prospect
    const prospect = await prisma.prospectWorkshop.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(email !== undefined && { email }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(estimatedRevenue !== undefined && { estimatedRevenue }),
        ...(lastContactDate && { lastContactDate: new Date(lastContactDate) }),
        ...(nextFollowUpDate !== undefined && { 
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null 
        })
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create interaction for status change
    if (status && status !== prospect.status) {
      await prisma.prospectInteraction.create({
        data: {
          prospectId: params.id,
          type: 'NOTE',
          notes: `Status geändert zu: ${status}`,
          createdById: employee.id,
          channel: 'SYSTEM'
        }
      });
    }

    return NextResponse.json({ prospect });
  } catch (error) {
    console.error('Error updating prospect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete Prospect
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all related data first
    await prisma.prospectNote.deleteMany({
      where: { prospectId: params.id }
    });

    await prisma.prospectTask.deleteMany({
      where: { prospectId: params.id }
    });

    await prisma.prospectInteraction.deleteMany({
      where: { prospectId: params.id }
    });

    // Delete prospect
    await prisma.prospectWorkshop.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
