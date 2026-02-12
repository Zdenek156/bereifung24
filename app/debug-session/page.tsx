'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DebugSessionPage() {
  const { data: session, status } = useSession()
  const [cookies, setCookies] = useState<string>('')
  const [sessionCheck, setSessionCheck] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get all cookies
    setCookies(document.cookie)
    
    // Log session status on mount
    console.log('[DEBUG SESSION PAGE] Initial load:', {
      status,
      session,
      timestamp: new Date().toISOString()
    })
  }, [])

  useEffect(() => {
    console.log('[DEBUG SESSION PAGE] Session changed:', {
      status,
      hasSession: !!session,
      user: session?.user,
      timestamp: new Date().toISOString()
    })
  }, [status, session])

  const checkSessionAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/session')
      const data = await response.json()
      setSessionCheck(data)
      console.log('[DEBUG SESSION API]:', data)
    } catch (error) {
      console.error('[DEBUG SESSION API] Error:', error)
      setSessionCheck({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const testNavigation = () => {
    console.log('[DEBUG] Testing navigation to dashboard...')
    window.location.href = '/dashboard/customer'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Session Debug</h1>
          
          <div className="space-y-4">
            {/* Status */}
            <div>
              <h2 className="font-semibold text-lg mb-2">Status</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>NextAuth Status:</strong> <span className={status === 'authenticated' ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
                <p><strong>Has Session:</strong> {session ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Timestamp:</strong> {new Date().toLocaleString('de-DE')}</p>
              </div>
            </div>

            {/* Session Data */}
            {session && (
              <div>
                <h2 className="font-semibold text-lg mb-2">Session Data</h2>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm overflow-auto">{JSON.stringify(session, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Cookies */}
            <div>
              <h2 className="font-semibold text-lg mb-2">Cookies</h2>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-auto whitespace-pre-wrap break-all">
                  {cookies || 'No cookies found'}
                </pre>
              </div>
              <button
                onClick={() => setCookies(document.cookie)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Cookies
              </button>
            </div>

            {/* API Check */}
            <div>
              <h2 className="font-semibold text-lg mb-2">Server-Side Session Check</h2>
              <button
                onClick={checkSessionAPI}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? 'Checking...' : 'Check Session API'}
              </button>
              
              {sessionCheck && (
                <div className="bg-gray-50 p-4 rounded mt-2">
                  <pre className="text-sm overflow-auto">{JSON.stringify(sessionCheck, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Navigation Test */}
            <div>
              <h2 className="font-semibold text-lg mb-2">Navigation Test</h2>
              <button
                onClick={testNavigation}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Navigate to Dashboard
              </button>
            </div>

            {/* Local Storage */}
            <div>
              <h2 className="font-semibold text-lg mb-2">localStorage</h2>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {typeof window !== 'undefined' ? JSON.stringify({
                    cookieConsent: localStorage.getItem('cookieConsent'),
                    bereifung24_cookie_consent: localStorage.getItem('bereifung24_cookie_consent'),
                    bereifung24_cookie_consent_date: localStorage.getItem('bereifung24_cookie_consent_date'),
                  }, null, 2) : 'Loading...'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Console Log Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-2">📋 Debugging Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open Browser DevTools (F12)</li>
            <li>Go to Console tab</li>
            <li>Look for logs starting with [DEBUG SESSION]</li>
            <li>Click "Check Session API" to verify server-side session</li>
            <li>Check "Cookies" tab in DevTools → Application → Cookies</li>
            <li>Look for: <code className="bg-gray-200 px-1">next-auth.session-token</code> or <code className="bg-gray-200 px-1">__Secure-next-auth.session-token</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
