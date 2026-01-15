import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';

// GET - Fetch all notes for a prospect
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notes = await prisma.prospectNote.findMany({
      where: { prospectId: params.id },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({
      notes: notes.map(note => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        createdBy: note.createdBy 
          ? `${note.createdBy.firstName} ${note.createdBy.lastName}`.trim()
          : 'Unbekannt'
      }))
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create Note
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
    const { content, isPinned } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const note = await prisma.prospectNote.create({
      data: {
        prospectId: params.id,
        content,
        isPinned: isPinned || false,
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

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
