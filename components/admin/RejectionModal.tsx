'use client'

import { useState } from 'react'

interface RejectionModalProps {
  application: any
  onClose: () => void
  onSuccess: () => void
}

export default function RejectionModal({
  application,
  onClose,
  onSuccess
}: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Bitte gib einen Grund für die Ablehnung ein')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/influencer-applications/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: application.id,
          rejectionReason: rejectionReason.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Ablehnen')
      }

      alert('✅ Bewerbung abgelehnt und E-Mail versendet!')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bewerbung ablehnen</h2>
          <p className="text-sm text-gray-600 mt-1">{application.name} ({application.email})</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grund für Ablehnung *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Erkläre kurz, warum die Bewerbung nicht angenommen wird..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-600">
            Der Antragsteller erhält eine Ablehnungs-E-Mail mit der Begründung.
          </p>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Wird abgelehnt...' : '❌ Ablehnen'}
          </button>
        </div>
      </div>
    </div>
  )
}
