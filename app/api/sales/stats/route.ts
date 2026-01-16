import { NextResponse } from 'next/server';
import { getSalesUser } from '@/lib/sales-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sales/stats
 * 
 * Get sales CRM statistics with time range filter
 */
export async function GET(request: Request) {
  try {
    const employee = await getSalesUser();
    
    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Get total prospects
    const totalProspects = await prisma.prospectWorkshop.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Get prospects by status
    const byStatus = await prisma.prospectWorkshop.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Get prospects by city (top cities)
    const byCitiesRaw = await prisma.prospectWorkshop.groupBy({
      by: ['city'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true,
      orderBy: {
        _count: {
          city: 'desc'
        }
      }
    });
    
    // Filter out null cities and take top 10
    const byCities = byCitiesRaw
      .filter(item => item.city !== null)
      .slice(0, 10);

    // Calculate conversion rate
    const totalConverted = await prisma.prospectWorkshop.count({
      where: {
        status: 'CONVERTED',
        createdAt: { gte: startDate }
      }
    });
    const conversionRate = totalProspects > 0 ? (totalConverted / totalProspects) * 100 : 0;

    // Calculate average lead score
    const prospects = await prisma.prospectWorkshop.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        leadScore: true
      }
    });
    const avgLeadScore = prospects.length > 0 
      ? prospects.reduce((sum, p) => sum + p.leadScore, 0) / prospects.length 
      : 0;

    // Get active tasks count
    const activeTasks = await prisma.prospectTask.count({
      where: {
        completed: false,
        createdAt: { gte: startDate }
      }
    });

    // Get recent activity
    const recentNotes = await prisma.prospectNote.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        prospect: {
          select: { name: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentTasks = await prisma.prospectTask.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        prospect: {
          select: { name: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentInteractions = await prisma.prospectInteraction.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        prospect: {
          select: { name: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Combine and sort all activities
    const allActivity = [
      ...recentNotes.map(n => ({
        id: n.id,
        type: 'NOTE',
        prospectName: n.prospect.name,
        createdAt: n.createdAt.toISOString(),
        createdBy: `${n.createdBy.firstName} ${n.createdBy.lastName}`
      })),
      ...recentTasks.map(t => ({
        id: t.id,
        type: 'TASK',
        prospectName: t.prospect.name,
        createdAt: t.createdAt.toISOString(),
        createdBy: `${t.createdBy.firstName} ${t.createdBy.lastName}`
      })),
      ...recentInteractions.map(i => ({
        id: i.id,
        type: i.type,
        prospectName: i.prospect.name,
        createdAt: i.createdAt.toISOString(),
        createdBy: `${i.createdBy.firstName} ${i.createdBy.lastName}`
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      totalProspects,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count
      })),
      byCities: byCities.map(c => ({
        city: c.city || 'Unbekannt',
        count: c._count
      })),
      conversionRate,
      avgLeadScore,
      activeTasks,
      recentActivity: allActivity.slice(0, 20)
    });

  } catch (error: any) {
    console.error('Error fetching sales stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 });
  }
}
