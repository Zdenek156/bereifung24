'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if on customer dashboard pages AND not authenticated
    if (status === 'unauthenticated' && pathname?.startsWith('/dashboard/customer')) {
      console.log('[CUSTOMER LAYOUT] Not authenticated on customer page, redirecting to login')
      router.push('/login?callbackUrl=' + pathname)
    }
  }, [status, router, pathname])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Session...</p>
        </div>
      </div>
    )
  }

  // Render content if authenticated (let backend handle role validation)
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <CustomerNavbar />
        <div>
          {children}
        </div>
      </div>
    </ThemeProvider>
  )
}
