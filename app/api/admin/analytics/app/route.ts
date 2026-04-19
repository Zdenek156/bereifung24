import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { getApiSetting } from '@/lib/api-settings'

// Firebase Analytics Data API v1beta
// Reads mobile app analytics from Firebase/Google Analytics

async function getAnalyticsClient() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
  const projectId = process.env.FIREBASE_PROJECT_ID

  if (!serviceAccountJson || !projectId) {
    throw new Error('Firebase Service Account nicht konfiguriert')
  }

  const credentials = JSON.parse(serviceAccountJson)

  const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/analytics.readonly']
  )

  await auth.authorize()

  const propertyId = await getApiSetting('FIREBASE_ANALYTICS_PROPERTY_ID', 'FIREBASE_ANALYTICS_PROPERTY_ID')
  return { auth, propertyId: propertyId ? `properties/${propertyId}` : '' }
}

// GET /api/admin/analytics/app - Get Firebase Analytics data for mobile app
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    switch (timeRange) {
      case '24h': startDate.setHours(now.getHours() - 24); break
      case '7d': startDate.setDate(now.getDate() - 7); break
      case '30d': startDate.setDate(now.getDate() - 30); break
      case '90d': startDate.setDate(now.getDate() - 90); break
      case 'year': startDate.setFullYear(now.getFullYear() - 1); break
      default: startDate.setDate(now.getDate() - 30)
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    const { auth, propertyId } = await getAnalyticsClient()

    if (!propertyId || propertyId === 'properties/') {
      return NextResponse.json({
        error: 'FIREBASE_ANALYTICS_PROPERTY_ID nicht konfiguriert. Bitte in .env setzen.',
        setup: true,
      }, { status: 400 })
    }

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth })

    // Run all queries in parallel
    const [
      overviewRes,
      dailyRes,
      screensRes,
      eventsRes,
      platformRes,
    ] = await Promise.all([
      // 1. Overview metrics: active users, sessions, events
      analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(now) }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagedSessions' },
            { name: 'averageSessionDuration' },
            { name: 'crashFreeUsersRate' },
          ],
        },
      }),

      // 2. Daily active users
      analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(now) }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' } }],
        },
      }),

      // 3. Top screens
      analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(now) }],
          dimensions: [{ name: 'unifiedScreenName' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        },
      }),

      // 4. Top events (custom events like search, booking, etc.)
      analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(now) }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' },
          ],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 20,
        },
      }),

      // 5. Platform breakdown (Android/iOS)
      analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(now) }],
          dimensions: [{ name: 'platform' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
        },
      }),
    ])

    // Parse overview
    const overviewRow = overviewRes.data.rows?.[0]
    const overview = {
      activeUsers: parseInt(overviewRow?.metricValues?.[0]?.value || '0'),
      newUsers: parseInt(overviewRow?.metricValues?.[1]?.value || '0'),
      sessions: parseInt(overviewRow?.metricValues?.[2]?.value || '0'),
      screenViews: parseInt(overviewRow?.metricValues?.[3]?.value || '0'),
      engagedSessions: parseInt(overviewRow?.metricValues?.[4]?.value || '0'),
      avgSessionDuration: parseFloat(overviewRow?.metricValues?.[5]?.value || '0'),
      crashFreeRate: parseFloat(overviewRow?.metricValues?.[6]?.value || '0'),
    }

    // Parse daily data
    const dailyData = (dailyRes.data.rows || []).map(row => ({
      date: row.dimensionValues?.[0]?.value || '',
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      screenViews: parseInt(row.metricValues?.[2]?.value || '0'),
    }))

    // Parse top screens
    const topScreens = (screensRes.data.rows || []).map(row => ({
      screen: row.dimensionValues?.[0]?.value || 'Unknown',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
    }))

    // Parse events
    const topEvents = (eventsRes.data.rows || []).map(row => ({
      event: row.dimensionValues?.[0]?.value || 'Unknown',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
    }))

    // Parse platform breakdown
    const platforms = (platformRes.data.rows || []).map(row => ({
      platform: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    }))

    return NextResponse.json({
      overview,
      dailyData,
      topScreens,
      topEvents,
      platforms,
      timeRange,
    })

  } catch (error: any) {
    console.error('App Analytics Error:', error)

    if (error.message?.includes('nicht konfiguriert')) {
      return NextResponse.json({ error: error.message, setup: true }, { status: 400 })
    }

    // Check for common API errors
    if (error.code === 403 || error.message?.includes('403')) {
      return NextResponse.json({
        error: 'Google Analytics Data API nicht aktiviert. Bitte in der Google Cloud Console aktivieren: https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        setup: true,
      }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Fehler beim Laden der App-Statistiken: ' + (error.message || 'Unbekannter Fehler') },
      { status: 500 }
    )
  }
}
