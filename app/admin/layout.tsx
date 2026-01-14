'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    // If no session after loading, redirect to login
    if (status === 'unauthenticated' || !session) {
      router.push('/login')
      return
    }

    // Allow ADMIN full access
    if (session.user.role === 'ADMIN') {
      return
    }

    // Allow B24_EMPLOYEE with permissions
    if (session.user.role === 'B24_EMPLOYEE') {
      // B24_EMPLOYEE can access admin areas based on their permissions
      // The middleware and individual pages will check specific permissions
      return
    }

    // Other roles redirect to their dashboard
    if (session.user.role === 'CUSTOMER') {
      router.push('/dashboard/customer')
    } else if (session.user.role === 'WORKSHOP') {
      router.push('/dashboard/workshop')
    } else {
      router.push('/dashboard')
    }
  }, [session, status, router, pathname])

  // Show loading spinner only when status is explicitly 'loading'
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Bereich...</p>
        </div>
      </div>
    )
  }

  // If session exists and user has proper role, show content
  if (session && (session.user.role === 'ADMIN' || session.user.role === 'B24_EMPLOYEE')) {
    return <>{children}</>
  }

  // For other cases, show loading (will redirect via useEffect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AdminGuard>{children}</AdminGuard>
    </SessionProvider>
  )
}
