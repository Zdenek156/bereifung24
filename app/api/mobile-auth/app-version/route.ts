import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/mobile-auth/app-version?platform=ios|android&currentVersion=1.0.0
 * Check if the app needs to be updated
 */
export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get('platform')
    const currentVersion = request.nextUrl.searchParams.get('currentVersion')

    if (!platform || !currentVersion) {
      return NextResponse.json(
        { error: 'platform und currentVersion Parameter erforderlich' },
        { status: 400 }
      )
    }

    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json(
        { error: 'Platform muss ios oder android sein' },
        { status: 400 }
      )
    }

    const appVersion = await prisma.appVersion.findUnique({
      where: { platform },
    })

    if (!appVersion) {
      // No version record yet - allow all versions
      return NextResponse.json({
        updateRequired: false,
        forceUpdate: false,
        latestVersion: currentVersion,
        updateUrl: null,
        releaseNotes: null,
      })
    }

    const needsUpdate = compareVersions(currentVersion, appVersion.minVersion) < 0
    const hasNewVersion = compareVersions(currentVersion, appVersion.latestVersion) < 0

    return NextResponse.json({
      updateRequired: needsUpdate,
      forceUpdate: needsUpdate && appVersion.forceUpdate,
      latestVersion: appVersion.latestVersion,
      minVersion: appVersion.minVersion,
      updateUrl: appVersion.updateUrl,
      releaseNotes: hasNewVersion ? appVersion.releaseNotes : null,
    })

  } catch (error) {
    console.error('[APP VERSION] Error:', error)
    return NextResponse.json({ error: 'Versionsprüfung fehlgeschlagen' }, { status: 500 })
  }
}

/**
 * Compare semantic versions: returns -1, 0, or 1
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA < numB) return -1
    if (numA > numB) return 1
  }
  return 0
}
