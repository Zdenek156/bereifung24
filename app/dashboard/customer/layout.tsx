'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CustomerNavbar from '@/components/CustomerNavbar'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading spinner while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // If wrong role, redirect to main dashboard
  if (session?.user.role !== 'CUSTOMER') {
    router.push('/dashboard')
    return null
  }

  // User is authenticated and has correct role - render content

  // Render immediately if authenticated (don't wait for redirect check)
  if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {
  // User is authenticated and has correct role - render content
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
