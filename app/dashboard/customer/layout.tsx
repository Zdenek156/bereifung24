'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CustomerNavbar from '@/components/CustomerNavbar'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    console.log('[CUSTOMER LAYOUT] useEffect triggered:', {
      status,
      hasSession: !!session,
      sessionUser: session?.user,
      timestamp: new Date().toISOString()
    })

    // Wait for session to fully initialize before checking
    const timer = setTimeout(() => {
      console.log('[CUSTOMER LAYOUT] After 1s delay:', {
        status,
        hasSession: !!session,
        sessionUser: session?.user
      })
      
      setIsChecking(false)
      
      // Only redirect if we're absolutely certain there's no session
      if (status === 'unauthenticated' && !session) {
        console.log('[CUSTOMER LAYOUT] ❌ Redirecting to login - no session found')
        router.push('/login')
        return
      }

      // Check role only if we have a session
      if (status === 'authenticated' && session?.user.role !== 'CUSTOMER') {
        console.log('[CUSTOMER LAYOUT] ❌ Wrong role, redirecting to /dashboard:', session.user.role)
        router.push('/dashboard')
        return
      }

      if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {
        console.log('[CUSTOMER LAYOUT] ✅ Authenticated customer, rendering content')
      }
    }, 1000) // Wait 1 second for session to fully initialize

    return () => clearTimeout(timer)
  }, [status, session, router])

  // Show loading spinner while checking or session is loading
  if (status === 'loading' || isChecking) {
    console.log('[CUSTOMER LAYOUT] Showing loading spinner:', { status, isChecking })
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Session... ({status})</p>
        </div>
      </div>
    )
  }

  // Only render if authenticated with correct role
  if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {
    console.log('[CUSTOMER LAYOUT] Rendering authenticated content')
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          {/* Top Navbar with Profile Dropdown */}
          <CustomerNavbar />
          
          {/* Main Content - Full Width */}
          <div>
            {children}
          </div>
        </div>
      </ThemeProvider>
    )
  }

  // Fallback: show loading while we wait for redirect
  console.log('[CUSTOMER LAYOUT] Showing fallback loading (waiting for redirect)')
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Weiterleitung...</p>
      </div>
    </div>
  )
}
