import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

// GET /api/eprel/test - Test EPREL API connection
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur für Administratoren' }, { status: 403 })
    }

    const apiKey = await getApiSetting('EPREL_API_KEY')
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'EPREL_API_KEY nicht konfiguriert',
        details: 'Bitte konfigurieren Sie den API Key in den Admin-Einstellungen'
      })
    }

    // Test verschiedene mögliche EPREL API Endpoints
    const testEndpoints = [
      'https://ec.europa.eu/energy/eeprel-api/v1/tyres',
      'https://ec.europa.eu/product-registry/api/v1/tyres',
      'https://webgate.ec.europa.eu/eeprel-api/v1/tyres',
      'https://eprel.ec.europa.eu/api/products/tyres'
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        const testUrl = `${endpoint}?limit=1`
        const startTime = Date.now()
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        const duration = Date.now() - startTime
        
        let responseText = ''
        let responseJson = null
        
        try {
          responseText = await response.text()
          responseJson = JSON.parse(responseText)
        } catch (e) {
          // Keep as text
        }

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries()),
          bodyPreview: responseText.substring(0, 500),
          bodyJson: responseJson
        })
      } catch (error: any) {
        results.push({
          endpoint,
          error: error.message,
          type: error.name
        })
      }
    }

    return NextResponse.json({
      success: true,
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      testResults: results,
      documentation: 'Basierend auf: https://webgate.ec.europa.eu/fpfis/wikis/display/ENERG/EPREL+API'
    })

  } catch (error) {
    console.error('Error testing EPREL:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Test',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}
