'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ApplicationsList from '@/components/admin/ApplicationsList'
import ApprovalModal from '@/components/admin/ApprovalModal'
import RejectionModal from '@/components/admin/RejectionModal'

export default function InfluencerApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadApplications()
    }
  }, [status, router])

  const loadApplications = async () => {
    try {
      const response = await fetch('/api/admin/influencer-applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Bewerbungen...</p>
        </div>
      </div>
    )
  }

  const pendingCount = applications.filter(a => a.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/influencer-management')}
            className="text-blue-600 hover:text-blue-800 mb-3 inline-flex items-center text-sm"
          >
            ← Zurück zum Influencer Management
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Influencer-Bewerbungen</h1>
              <p className="mt-2 text-gray-600">
                Prüfe und genehmige neue Influencer-Bewerbungen
                {pendingCount > 0 && (
                  <span className="ml-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    {pendingCount} offen
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <ApplicationsList
          applications={applications}
          onApprove={(app) => {
            setSelectedApplication(app)
            setShowApprovalModal(true)
          }}
          onReject={(app) => {
            setSelectedApplication(app)
            setShowRejectionModal(true)
          }}
        />

        {/* Approval Modal */}
        {showApprovalModal && selectedApplication && (
          <ApprovalModal
            application={selectedApplication}
            onClose={() => {
              setShowApprovalModal(false)
              setSelectedApplication(null)
            }}
            onSuccess={() => {
              loadApplications()
            }}
          />
        )}

        {/* Rejection Modal */}
        {showRejectionModal && selectedApplication && (
          <RejectionModal
            application={selectedApplication}
            onClose={() => {
              setShowRejectionModal(false)
              setSelectedApplication(null)
            }}
            onSuccess={() => {
              loadApplications()
            }}
          />
        )}
      </div>
    </div>
  )
}
