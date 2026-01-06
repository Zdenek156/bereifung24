'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function ManualBookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href="/admin/buchhaltung" 
            className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
          >
            ← Zurück zur Buchhaltung
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Manuelle Buchung</h1>
          <p className="mt-1 text-sm text-gray-600">Neuen Buchungseintrag erstellen</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Funktion in Entwicklung</h3>
            <p className="mt-2 text-sm text-gray-500">
              Die manuelle Buchungsfunktion wird in Phase 3 implementiert.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
