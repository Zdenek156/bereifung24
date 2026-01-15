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

    // Find prospect by googlePlaceId
    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId: params.id }
    });

    if (!prospect) {
      // No prospect yet, return empty notes array
      return NextResponse.json({ notes: [] });
    }

    const notes = await prisma.prospectNote.findMany({
      where: { prospectId: prospect.id },
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
    const { content, isPinned, prospectData } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Ensure prospect exists (create if from Google Places)
    let prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId: params.id }
    });

    if (!prospect && prospectData) {
      // Create prospect from Google Places data
      prospect = await prisma.prospectWorkshop.create({
        data: {
          googlePlaceId: params.id,
          name: prospectData.name || 'Unbekannter Prospect',
          address: prospectData.address || '',
          city: prospectData.city || '',
          postalCode: prospectData.postalCode || '',
          latitude: prospectData.lat || 0,
          longitude: prospectData.lng || 0,
          phone: prospectData.phone || null,
          website: prospectData.website || null,
          rating: prospectData.rating || null,
          reviewCount: prospectData.reviewCount || 0,
          priceLevel: prospectData.priceLevel || null,
          photoUrls: prospectData.photoUrls || [],
          placeTypes: [],
          source: 'GOOGLE_PLACES',
          status: 'NEW'
        }
      });
    }

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found and no prospect data provided' },
        { status: 400 }
      );
    }

    const note = await prisma.prospectNote.create({
      data: {
        prospectId: prospect.id,
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

    return NextResponse.json({ 
      success: true,
      note: {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        createdBy: note.createdBy 
          ? `${note.createdBy.firstName} ${note.createdBy.lastName}`.trim()
          : 'Unbekannt'
      }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
