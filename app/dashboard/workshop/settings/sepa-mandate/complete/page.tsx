'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function SEPAMandateCompleteContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [completing, setCompleting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && searchParams) {
      completeMandateSetup()
    }
  }, [session, searchParams])

  const completeMandateSetup = async () => {
    const redirectFlowId = searchParams.get('redirect_flow_id')
    
    // Get session token from sessionStorage
    const sessionToken = sessionStorage.getItem('gc_session_token')
    const storedFlowId = sessionStorage.getItem('gc_redirect_flow_id')

    if (!redirectFlowId || !sessionToken) {
      setError('Fehlende Mandats-Informationen. Bitte versuchen Sie es erneut.')
      setCompleting(false)
      return
    }

    try {
      const res = await fetch('/api/workshop/sepa-mandate/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirectFlowId,
          sessionToken
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        // Clean up sessionStorage
        sessionStorage.removeItem('gc_session_token')
        sessionStorage.removeItem('gc_redirect_flow_id')
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/workshop/settings?tab=sepa')
        }, 3000)
      } else {
        setError(data.error || 'Fehler beim Abschließen des Mandats')
      }
    } catch (err) {
      console.error('Error completing mandate:', err)
      setError('Netzwerkfehler beim Abschließen des Mandats')
    } finally {
      setCompleting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {completing && (
            <>
              <div className="mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Mandat wird abgeschlossen...
              </h1>
              <p className="text-gray-600">
                Bitte warten Sie einen Moment
              </p>
            </>
          )}

          {error && (
            <>
              <div className="mb-6">
                <svg className="w-16 h-16 text-red-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Fehler
              </h1>
              <p className="text-red-600 mb-6">
                {error}
              </p>
              <button
                onClick={() => router.push('/dashboard/workshop/settings?tab=sepa')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Zurück zu Einstellungen
              </button>
            </>
          )}

          {success && (
            <>
              <div className="mb-6">
                <svg className="w-16 h-16 text-green-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                SEPA-Mandat erfolgreich eingerichtet!
              </h1>
              <p className="text-gray-600 mb-6">
                Ihr Lastschriftmandat wurde erfolgreich erstellt. Sie werden automatisch weitergeleitet...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span>Weiterleitung...</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SEPAMandateCompletePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <SEPAMandateCompleteContent />
    </Suspense>
  )
}
