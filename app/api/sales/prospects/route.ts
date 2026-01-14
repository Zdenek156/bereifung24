import { NextResponse } from 'next/server';
import { getSalesUser } from '@/lib/sales-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sales/prospects
 * 
 * Get list of prospects with filters
 */
export async function GET(request: Request) {
  try {
    const employee = await getSalesUser();
    
    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Filters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode');
    const search = searchParams.get('search');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToMe) where.assignedToId = employee.id;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (postalCode) where.postalCode = { startsWith: postalCode };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    // Get prospects
    const [prospects, total] = await Promise.all([
      prisma.prospectWorkshop.findMany({
        where,
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
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              type: true,
              createdAt: true
            }
          },
          tasks: {
            where: { completed: false },
            orderBy: { dueDate: 'asc' },
            take: 1,
            select: {
              title: true,
              dueDate: true,
              priority: true
            }
          },
          _count: {
            select: {
              interactions: true,
              tasks: true,
              notes: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { leadScore: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.prospectWorkshop.count({ where })
    ]);

    return NextResponse.json({
      prospects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch prospects',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * POST /api/sales/prospects
 * 
 * Import prospects from Google Places search
 */
export async function POST(request: Request) {
  try {
    const employee = await getSalesUser();
    
    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { prospects } = body;

    if (!Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ error: 'No prospects provided' }, { status: 400 });
    }

    const imported = [];
    const errors = [];

    for (const prospect of prospects) {
      try {
        // Check if already exists
        const existing = await prisma.prospectWorkshop.findUnique({
          where: { googlePlaceId: prospect.placeId }
        });

        if (existing) {
          errors.push({ placeId: prospect.placeId, error: 'Already exists' });
          continue;
        }

        // Create new prospect
        const newProspect = await prisma.prospectWorkshop.create({
          data: {
            googlePlaceId: prospect.placeId,
            name: prospect.name,
            address: prospect.address,
            city: prospect.city || '',
            postalCode: prospect.postalCode || '',
            latitude: prospect.lat,
            longitude: prospect.lng,
            phone: prospect.phone || null,
            website: prospect.website || null,
            rating: prospect.rating || null,
            reviewCount: prospect.reviewCount || 0,
            leadScore: prospect.leadScore || 0,
            status: 'NEW',
            priority: prospect.leadScore >= 70 ? 'HIGH' : prospect.leadScore >= 50 ? 'MEDIUM' : 'LOW',
            assignedToId: employee.id
          }
        });

        imported.push(newProspect);
      } catch (error: any) {
        console.error(`Error importing prospect ${prospect.placeId}:`, error);
        errors.push({ placeId: prospect.placeId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors: errors.length,
      details: { imported, errors }
    });

  } catch (error: any) {
    console.error('Error importing prospects:', error);
    return NextResponse.json({ 
      error: 'Failed to import prospects',
      details: error.message 
    }, { status: 500 });
  }
}
