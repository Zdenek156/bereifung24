import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sales/prospects
 * 
 * Get list of prospects with filters
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email }
    });

    if (!employee || !employee.isActive) {
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
