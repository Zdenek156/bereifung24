'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import EmployeeSidebar from '@/components/EmployeeSidebar'

export default function MitarbeiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Nur B24_EMPLOYEE darf ins Mitarbeiter-Portal
    if (session.user.role !== 'B24_EMPLOYEE') {
      if (session.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, status, router])

  if (status === 'loading' || !session || session.user.role !== 'B24_EMPLOYEE') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeSidebar />
      
      {/* Main Content - with left margin for sidebar */}
      <div className="lg:ml-64">
        {children}
      </div>
    </div>
  )
}
