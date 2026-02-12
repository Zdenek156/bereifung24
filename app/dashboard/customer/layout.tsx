'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import CustomerNavbar from '@/components/CustomerNavbar'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Wait until session is definitely loaded (not just loading)
    if (status === 'loading') return

    // Only redirect after we're certain there's no session
    // Give it time to load properly
    const timer = setTimeout(() => {
      if (status === 'unauthenticated') {
        router.push('/login')
        return
      }

      // Check role only after session is confirmed loaded
      if (session && session.user.role !== 'CUSTOMER') {
        router.push('/dashboard')
        return
      }
    }, 100) // Small delay to ensure session is fully loaded

    return () => clearTimeout(timer)
  }, [session, status, router])

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Render immediately if authenticated (don't wait for redirect check)
  if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {

  // Render immediately if authenticated (don't wait for redirect check)
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

  // Show nothing while redirecting (prevents flash of content)
  return null
}
