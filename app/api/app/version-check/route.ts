import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public endpoint — called by mobile app at startup.
// GET /api/app/version-check?platform=ios&version=1.0.12
//   → { platform, installedVersion, minVersion, latestVersion,
//        updateRequired, updateAvailable, storeUrl, message }
//
// `updateRequired = true`  → app must show blocking dialog
// `updateAvailable = true` → app may show optional dismissible hint

export const dynamic = 'force-dynamic';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((s) => parseInt(s, 10) || 0);
  const pb = b.split('.').map((s) => parseInt(s, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platformRaw = (searchParams.get('platform') || '').toLowerCase();
    const installedVersion = searchParams.get('version') || '';

    if (platformRaw !== 'ios' && platformRaw !== 'android') {
      return NextResponse.json(
        { error: 'platform must be "ios" or "android"' },
        { status: 400 }
      );
    }

    const config = await prisma.appVersionConfig.findUnique({
      where: { platform: platformRaw },
    });

    // No config → never block
    if (!config) {
      return NextResponse.json({
        platform: platformRaw,
        installedVersion,
        minVersion: null,
        latestVersion: null,
        updateRequired: false,
        updateAvailable: false,
        storeUrl: null,
        message: null,
      });
    }

    let updateRequired = false;
    let updateAvailable = false;

    if (installedVersion) {
      // Forced if explicit forceUpdate flag, OR installed < minVersion
      updateRequired =
        config.forceUpdate ||
        compareVersions(installedVersion, config.minVersion) < 0;

      // Optional hint when not forced and a newer version exists
      updateAvailable =
        !updateRequired &&
        compareVersions(installedVersion, config.latestVersion) < 0;
    }

    return NextResponse.json({
      platform: config.platform,
      installedVersion,
      minVersion: config.minVersion,
      latestVersion: config.latestVersion,
      updateRequired,
      updateAvailable,
      storeUrl: config.storeUrl,
      message: config.message,
    });
  } catch (error) {
    console.error('❌ [API] version-check error:', error);
    // Never block app startup on backend errors
    return NextResponse.json(
      {
        updateRequired: false,
        updateAvailable: false,
        error: 'internal',
      },
      { status: 200 }
    );
  }
}
