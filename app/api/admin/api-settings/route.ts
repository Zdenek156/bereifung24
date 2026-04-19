import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clearApiSettingsCache } from '@/lib/api-settings'

// GET /api/admin/api-settings - Get all API settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const settings = await prisma.adminApiSetting.findMany({
      orderBy: { key: 'asc' }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching API settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/api-settings - Update API settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { settings } = await req.json()

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Ungültiges Format' },
        { status: 400 }
      )
    }

    // Update each setting
    for (const setting of settings) {
      await prisma.adminApiSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          description: getDescriptionForKey(setting.key)
        }
      })
    }

    // Clear cache so new values are used immediately
    clearApiSettingsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating API settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}

// Helper to get description for each key
function getDescriptionForKey(key: string): string {
  const descriptions: Record<string, string> = {
    'GOCARDLESS_ACCESS_TOKEN': 'GoCardless API Access Token für SEPA-Lastschriften',
    'GOCARDLESS_ENVIRONMENT': 'GoCardless Umgebung (sandbox oder live)',
    'GOOGLE_OAUTH_CLIENT_ID': 'Google OAuth Client ID für Calendar Integration',
    'GOOGLE_OAUTH_CLIENT_SECRET': 'Google OAuth Client Secret',
    'WEATHERAPI_KEY': 'WeatherAPI.com API Key für Wetter-basierte Reifenwechsel-Erinnerungen (1M Calls/Monat kostenlos)',
    'EPREL_API_KEY': 'EPREL API Key für EU Reifenlabel-Daten (European Product Database for Energy Labelling)',
    'API_NINJAS_KEY': 'API Ninjas Key für VIN Lookup und Fahrzeugsuche (50k Calls/Monat kostenlos - https://api-ninjas.com)',
    'PAYPAL_CLIENT_ID': 'PayPal REST API Client ID (aus PayPal Developer Dashboard > Apps & Credentials)',
    'PAYPAL_CLIENT_SECRET': 'PayPal REST API Client Secret (aus PayPal Developer Dashboard > Apps & Credentials)',
    'PAYPAL_WEBHOOK_ID': 'PayPal Webhook ID (nach Webhook-Erstellung im Dashboard - Format: WH-xxxxxxxxxxxxx)',
    'PAYPAL_API_URL': 'PayPal API URL (Sandbox: https://api-m.sandbox.paypal.com | Live: https://api-m.paypal.com)',
    'STRIPE_SECRET_KEY': 'Stripe Secret Key (aus Stripe Dashboard > Developers > API keys - Format: sk_test_xxx oder sk_live_xxx)',
    'STRIPE_PUBLISHABLE_KEY': 'Stripe Publishable Key (aus Stripe Dashboard > Developers > API keys - Format: pk_test_xxx oder pk_live_xxx)',
    'GOOGLE_SEARCH_CONSOLE_KEY': 'Google Search Console Service Account JSON Key (kompletter JSON-Inhalt des heruntergeladenen Schlüssels)',
    'INSTAGRAM_APP_SECRET': 'Instagram App-Geheimnis für Token-Exchange (Instagram Business Login API)',
    'THREADS_APP_ID': 'Threads App-ID (von Meta Developer Dashboard → Threads API → Einstellungen)',
    'THREADS_APP_SECRET': 'Threads App-Geheimnis (von Meta Developer Dashboard → Threads API → Einstellungen)',
    'LINKEDIN_CLIENT_ID': 'LinkedIn OAuth Client ID (von LinkedIn Developer Portal → App → Auth)',
    'LINKEDIN_CLIENT_SECRET': 'LinkedIn OAuth Client Secret (von LinkedIn Developer Portal → App → Auth)',
    'TIKTOK_CLIENT_KEY': 'TikTok App Client Key (von TikTok for Developers → App → Keys)',
    'TIKTOK_CLIENT_SECRET': 'TikTok App Client Secret (von TikTok for Developers → App → Keys)',
    'YOUTUBE_CLIENT_ID': 'YouTube/Google OAuth Client ID für YouTube Data API v3',
    'YOUTUBE_CLIENT_SECRET': 'YouTube/Google OAuth Client Secret für YouTube Data API v3',
    'ELEVENLABS_API_KEY': 'ElevenLabs API Key für KI-Sprachausgabe (Text-to-Speech) im App KI-Berater "Rollo" (elevenlabs.io)',
    'ELEVENLABS_VOICE_ID': 'ElevenLabs Voice ID für die Stimme von "Rollo" (z.B. pNInz6obpgDQGcFmaJgB für Adam)',
    'FIREBASE_ANALYTICS_PROPERTY_ID': 'Firebase/Google Analytics 4 Property-ID für App-Statistiken (aus Firebase Console → Projekteinstellungen → Integrationen → Google Analytics, z.B. 123456789)',
  }
  return descriptions[key] || ''
}
