'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Redirect /home to / (new homepage with search)
 * This page redirects all traffic from the old /home URL to the new homepage
 */
export default function HomeRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Preserve any query parameters
    const searchParams = new URLSearchParams(window.location.search)
    const queryString = searchParams.toString()
    const destination = queryString ? `/?${queryString}` : '/'
    
    console.log('[HomeRedirect] Redirecting from /home to', destination)
    router.replace(destination)
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Weiterleitung zur Startseite...</p>
      </div>
    </div>
  )
}
