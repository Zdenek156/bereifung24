import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';

/**
 * GET /api/sales/prospects/[id]/tasks
 * Get all tasks for a prospect
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find prospect by googlePlaceId (params.id is Google Places ID)
    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId: params.id }
    });

    if (!prospect) {
      // No prospect in DB yet, return empty tasks array
      return NextResponse.json({ tasks: [] });
    }

    const tasks = await prisma.prospectTask.findMany({
      where: { prospectId: prospect.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        assignedTo: task.assignedTo?.id,
        assignedToName: task.assignedTo 
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim()
          : undefined,
        createdAt: task.createdAt.toISOString(),
        createdBy: task.createdBy 
          ? `${task.createdBy.firstName} ${task.createdBy.lastName}`.trim()
          : 'Unbekannt'
      }))
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/sales/prospects/[id]/tasks
 * Create a new task for a prospect
 */
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
    const { title, description, dueDate, priority, assignedTo, prospectData } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Ensure prospect exists (create if from Google Places)
    let prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId: params.id }
    });

    if (!prospect && prospectData) {
      // Create prospect with ALL required fields
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

    const task = await prisma.prospectTask.create({
      data: {
        prospectId: prospect.id,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: 'NEW',
        assignedToId: assignedTo || null,
        createdById: employee.id
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        assignedTo: task.assignedTo?.id,
        assignedToName: task.assignedTo 
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim()
          : undefined,
        createdAt: task.createdAt.toISOString(),
        createdBy: task.createdBy 
          ? `${task.createdBy.firstName} ${task.createdBy.lastName}`.trim()
          : 'Unbekannt'
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
