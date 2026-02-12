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
    // Don't redirect while loading
    if (status === 'loading') return

    // Only redirect if definitely not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Check role only after session is loaded
    if (session && session.user.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Don't render content until authenticated
  if (!session || session.user.role !== 'CUSTOMER') {
    return null
  }

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
