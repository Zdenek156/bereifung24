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
    // Based on official EPREL support response - correct endpoint is exportProducts/tyres (without version number)
    const testEndpoints = [
      'https://eprel.ec.europa.eu/api/exportProducts/tyres', // CORRECT endpoint from support
      'https://eprel.ec.europa.eu/api/products/tyres',       // Old attempt
      'https://ec.europa.eu/energy/eeprel-api/v1/tyres',
      'https://webgate.ec.europa.eu/eeprel-api/v1/tyres'
    ]

    const results = []

    for (const endpoint of testEndpoints) {
      try {
        // No limit parameter for exportProducts endpoint - it returns a ZIP file
        const testUrl = endpoint
        const startTime = Date.now()
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey, // Note: Capital K in Api-Key as per support
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout for potential large download
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
