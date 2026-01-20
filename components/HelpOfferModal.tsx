'use client'

import { useState } from 'react'
import { X, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HelpOffer {
  id: string
  message?: string
  status: string
  createdAt: string
  helper: {
    firstName: string
    lastName: string
  }
}

interface HelpOfferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  taskId: string
  taskTitle: string
  existingOffers?: HelpOffer[]
}

export default function HelpOfferModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  taskId, 
  taskTitle,
  existingOffers = []
}: HelpOfferModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/help-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          message: message.trim() || undefined
        })
      })

      if (response.ok) {
        onSuccess()
        onClose()
        setMessage('')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Anbieten von Hilfe')
      }
    } catch (error) {
      console.error('Error offering help:', error)
      alert('Fehler beim Anbieten von Hilfe')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OFFERED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            <Clock className="h-3 w-3" />
            Angeboten
          </span>
        )
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            <CheckCircle className="h-3 w-3" />
            Angenommen
          </span>
        )
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
            <XCircle className="h-3 w-3" />
            Abgelehnt
          </span>
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Hilfe anbieten</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-1">Aufgabe</h3>
            <p className="text-gray-600">{taskTitle}</p>
          </div>

          {existingOffers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Bestehende Hilfsangebote</h3>
              <div className="space-y-3">
                {existingOffers.map((offer) => (
                  <div key={offer.id} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          {offer.helper.firstName} {offer.helper.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(offer.createdAt).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                      {getStatusBadge(offer.status)}
                    </div>
                    {offer.message && (
                      <p className="text-sm text-gray-700 mt-2">{offer.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nachricht (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                rows={4}
                placeholder="Beschreiben Sie, wie Sie helfen können..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sendet...' : 'Hilfe anbieten'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
