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
    // Wait for session to fully initialize before checking
    const timer = setTimeout(() => {
      setIsChecking(false)
      
      // Only redirect if we're absolutely certain there's no session
      if (status === 'unauthenticated' && !session) {
        router.push('/login')
        return
      }

      // Check role only if we have a session
      if (status === 'authenticated' && session?.user.role !== 'CUSTOMER') {
        router.push('/dashboard')
        return
      }
    }, 1000) // Wait 1 second for session to fully initialize

    return () => clearTimeout(timer)
  }, [status, session, router])

  // Show loading spinner while checking or session is loading
  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
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

  // Fallback: show loading while we wait for redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}
