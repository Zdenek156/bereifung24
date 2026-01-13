/**
 * Permission Guard Component
 * Protects admin pages by checking if user has access to the application
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserPermissions } from '@/lib/hooks/useUserPermissions'

interface PermissionGuardProps {
  applicationKey: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ applicationKey, children, fallback }: PermissionGuardProps) {
  const { hasAccess, loading, isAdmin } = useUserPermissions()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!hasAccess(applicationKey) && !isAdmin) {
        // User doesn't have access - redirect to dashboard
        router.push('/mitarbeiter')
      } else {
        setChecking(false)
      }
    }
  }, [hasAccess, applicationKey, loading, isAdmin, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Prüfe Berechtigungen...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess(applicationKey) && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
          <p className="text-gray-600 mb-6">
            Sie haben keine Berechtigung für dieses Modul. Wenden Sie sich an Ihren Administrator, 
            wenn Sie Zugriff benötigen.
          </p>
          <button
            onClick={() => router.push('/mitarbeiter')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
