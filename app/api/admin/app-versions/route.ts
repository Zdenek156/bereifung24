import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/app-versions — list all platform configs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.appVersionConfig.findMany({
      orderBy: { platform: 'asc' },
    });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('❌ [API] app-versions GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT /api/admin/app-versions — upsert a platform config
// Body: { platform, minVersion, latestVersion, forceUpdate, storeUrl, message? }
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const platform = String(body.platform || '').toLowerCase();
    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json(
        { error: 'platform must be "ios" or "android"' },
        { status: 400 }
      );
    }

    const minVersion = String(body.minVersion || '').trim();
    const latestVersion = String(body.latestVersion || '').trim();
    const storeUrl = String(body.storeUrl || '').trim();
    const forceUpdate = Boolean(body.forceUpdate);
    const message =
      typeof body.message === 'string' && body.message.trim().length > 0
        ? body.message.trim()
        : null;

    if (!minVersion || !latestVersion || !storeUrl) {
      return NextResponse.json(
        { error: 'minVersion, latestVersion and storeUrl are required' },
        { status: 400 }
      );
    }

    const result = await prisma.appVersionConfig.upsert({
      where: { platform },
      create: {
        platform,
        minVersion,
        latestVersion,
        storeUrl,
        forceUpdate,
        message,
        updatedBy: session.user.email || session.user.id,
      },
      update: {
        minVersion,
        latestVersion,
        storeUrl,
        forceUpdate,
        message,
        updatedBy: session.user.email || session.user.id,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [API] app-versions PUT error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
