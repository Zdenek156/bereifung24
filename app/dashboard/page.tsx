'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Redirect based on role
    switch (session.user.role) {
      case 'CUSTOMER':
        router.push('/dashboard/customer')
        break
      case 'WORKSHOP':
        router.push('/dashboard/workshop')
        break
      case 'ADMIN':
        router.push('/admin')
        break
      default:
        router.push('/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Weiterleitung...</p>
      </div>
    </div>
  )
}
