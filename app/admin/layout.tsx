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

    if (!session) {
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
      // The individual pages will check specific permissions
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
    return null
  }

  return <>{children}</>
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
