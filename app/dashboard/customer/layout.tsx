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
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Only check for redirect after session is fully loaded
    if (status === 'loading') return

    // Give session more time to load properly (prevent race condition)
    const timer = setTimeout(() => {
      if (status === 'unauthenticated') {
        setShouldRedirect(true)
        router.push('/login')
        return
      }

      if (session && session.user.role !== 'CUSTOMER') {
        setShouldRedirect(true)
        router.push('/dashboard')
        return
      }
    }, 250) // Wait 250ms to ensure session is fully loaded

    return () => clearTimeout(timer)
  }, [status, session, router])

  // Show loading spinner while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (shouldRedirect) {
    return null
  }

  // Only render if authenticated with correct role
  if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {
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

  // Show nothing while waiting for session to load
  return null
}
