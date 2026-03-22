import { google } from 'googleapis'
import { getApiSetting } from '@/lib/api-settings'

const SITE_URL = 'sc-domain:bereifung24.de'

interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCQueryData {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCPageData {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GSCOverview {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
}

export interface GSCData {
  overview: GSCOverview
  topQueries: GSCQueryData[]
  topPages: GSCPageData[]
  dailyData: Array<{ date: string; clicks: number; impressions: number }>
}

async function getSearchConsoleClient() {
  const jsonKeyStr = await getApiSetting('GOOGLE_SEARCH_CONSOLE_KEY')
  
  if (!jsonKeyStr) {
    throw new Error('Google Search Console API Key nicht konfiguriert. Bitte in API-Einstellungen hinterlegen.')
  }

  let credentials: { client_email: string; private_key: string }
  try {
    credentials = JSON.parse(jsonKeyStr)
  } catch {
    throw new Error('Ungültiger JSON Key. Bitte den kompletten JSON-Inhalt des Service Account Schlüssels einfügen.')
  }

  const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/webmasters.readonly']
  )

  return google.searchconsole({ version: 'v1', auth })
}

export async function getSearchConsoleData(
  timeRange: string = '7d',
  filter?: string
): Promise<GSCData> {
  const client = await getSearchConsoleClient()

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() - 2) // GSC data has 2-day delay

  const startDate = new Date(endDate)
  switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    default:
      startDate.setDate(endDate.getDate() - 7)
  }

  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  const dimensionFilterGroups = filter ? [{
    filters: [{
      dimension: 'page',
      operator: 'contains',
      expression: filter,
    }]
  }] : undefined

  // Fetch all data in parallel
  const [queryResponse, pageResponse, dateResponse] = await Promise.all([
    // Top queries
    client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['query'],
        rowLimit: 20,
        dimensionFilterGroups,
      },
    }),
    // Top pages
    client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['page'],
        rowLimit: 20,
        dimensionFilterGroups,
      },
    }),
    // Daily data
    client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['date'],
        dimensionFilterGroups,
      },
    }),
  ])

  const queryRows = (queryResponse.data.rows || []) as SearchAnalyticsRow[]
  const pageRows = (pageResponse.data.rows || []) as SearchAnalyticsRow[]
  const dateRows = (dateResponse.data.rows || []) as SearchAnalyticsRow[]

  // Calculate overview
  const totalClicks = dateRows.reduce((sum, r) => sum + (r.clicks || 0), 0)
  const totalImpressions = dateRows.reduce((sum, r) => sum + (r.impressions || 0), 0)
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
  const avgPosition = dateRows.length > 0
    ? dateRows.reduce((sum, r) => sum + (r.position || 0), 0) / dateRows.length
    : 0

  return {
    overview: {
      totalClicks,
      totalImpressions,
      avgCtr,
      avgPosition,
    },
    topQueries: queryRows.map(r => ({
      query: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    })),
    topPages: pageRows.map(r => ({
      page: r.keys[0].replace('https://bereifung24.de', '').replace('https://www.bereifung24.de', '') || '/',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    })),
    dailyData: dateRows.map(r => ({
      date: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
    })),
  }
}
