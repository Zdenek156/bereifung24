import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

// GET /api/eprel/test - Test EPREL API connection with various header combinations
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

    // Test verschiedene Header-Kombinationen für den korrekten Endpoint
    const endpoint = 'https://eprel.ec.europa.eu/api/exportProducts/tyres'
    
    const headerVariations = [
      {
        name: 'X-Api-Key (Capital K)',
        headers: { 'X-Api-Key': apiKey }
      },
      {
        name: 'X-API-Key (All Caps)',
        headers: { 'X-API-Key': apiKey }
      },
      {
        name: 'x-api-key (lowercase)',
        headers: { 'x-api-key': apiKey }
      },
      {
        name: 'Authorization Bearer',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      },
      {
        name: 'Authorization API-Key',
        headers: { 'Authorization': `API-Key ${apiKey}` }
      },
      {
        name: 'X-Api-Key + User-Agent',
        headers: { 
          'X-Api-Key': apiKey,
          'User-Agent': 'Bereifung24/1.0'
        }
      },
      {
        name: 'X-Api-Key + Accept ZIP',
        headers: { 
          'X-Api-Key': apiKey,
          'Accept': 'application/zip, application/octet-stream, */*'
        }
      }
    ]

    const results = []

    for (const variation of headerVariations) {
      try {
        const startTime = Date.now()
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: variation.headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(30000)
        })

        const duration = Date.now() - startTime
        
        let responseText = ''
        let responseJson = null
        let isZip = false
        let fileSize = 0
        
        // Check if response is a ZIP file
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/zip') || contentType.includes('application/octet-stream')) {
          isZip = true
          const buffer = await response.arrayBuffer()
          fileSize = buffer.byteLength
          responseText = `ZIP file received (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
        } else {
          try {
            responseText = await response.text()
            responseJson = JSON.parse(responseText)
          } catch (e) {
            // Keep as text
          }
        }

        results.push({
          headerTest: variation.name,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          contentType,
          isZip,
          fileSize: isZip ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : undefined,
          bodyPreview: responseText.substring(0, 200),
          bodyJson: responseJson,
          requestHeaders: variation.headers,
          responseHeaders: Object.fromEntries(response.headers.entries())
        })
      } catch (error: any) {
        results.push({
          headerTest: variation.name,
          error: error.message,
          type: error.name,
          requestHeaders: variation.headers
        })
      }
    }

    return NextResponse.json({
      success: true,
      endpoint,
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      testResults: results,
      documentation: 'Testing verschiedene Header-Kombinationen um 403 zu debuggen'
    })
  } catch (error: any) {
    console.error('EPREL Test Error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
    }, { status: 500 })
  }
}
