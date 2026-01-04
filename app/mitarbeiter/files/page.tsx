'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function MitarbeiterFilesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Nur B24_EMPLOYEE dürfen auf diese Seite
    if (session.user.role !== 'B24_EMPLOYEE') {
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dateiverwaltung
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gemeinsame Dateien & Ordner
              </p>
            </div>
            <button
              onClick={() => router.push('/mitarbeiter')}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              ← Zurück zum Portal
            </button>
          </div>
        </div>
      </div>

      {/* Files Content - Embedded from Admin */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <iframe
          src="/admin/files"
          className="w-full h-[calc(100vh-180px)] border-0 rounded-lg shadow-sm"
          title="Dateiverwaltung"
        />
      </div>
    </div>
  )
}
