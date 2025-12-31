'use client'

import { useState } from 'react'

interface Props {
  application: any
  onClose: () => void
  onSuccess: () => void
}

export default function ApprovalModal({ application, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    code: application.channelName.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '') + Math.floor(Math.random() * 100),
    commissionPer1000Views: 300,
    commissionPerCustomerRegistration: 1500,
    commissionPerCustomerFirstOffer: 2500,
    commissionPerWorkshopRegistration: 2000,
    commissionPerWorkshopFirstOffer: 3000,
    isUnlimited: true
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/influencer-applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          ...formData
        })
      })

      if (response.ok) {
        alert('✅ Influencer erfolgreich freigeschaltet und Welcome-E-Mail versendet!')
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Freischalten')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Freischalten')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Influencer freischalten</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="font-medium text-gray-900">{application.name}</p>
            <p className="text-sm text-gray-600">{application.email}</p>
            <p className="text-sm text-gray-600">{application.platform} · {application.channelName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate-Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Provisionen (in Cent)</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Pro 1000 Views (CPM)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.commissionPer1000Views}
                    onChange={(e) => setFormData({...formData, commissionPer1000Views: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                  <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPer1000Views / 100).toFixed(2)}</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Kunden-Provisionen</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🎯 Pro registriertem Kunden
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.commissionPerCustomerRegistration}
                        onChange={(e) => setFormData({...formData, commissionPerCustomerRegistration: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerCustomerRegistration / 100).toFixed(2)}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ✅ Pro erstem Angebot vom Kunden
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.commissionPerCustomerFirstOffer}
                        onChange={(e) => setFormData({...formData, commissionPerCustomerFirstOffer: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerCustomerFirstOffer / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Werkstatt-Provisionen</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏪 Pro registrierter Werkstatt
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.commissionPerWorkshopRegistration}
                        onChange={(e) => setFormData({...formData, commissionPerWorkshopRegistration: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerWorkshopRegistration / 100).toFixed(2)}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏆 Pro erstem Angebot von Werkstatt
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.commissionPerWorkshopFirstOffer}
                        onChange={(e) => setFormData({...formData, commissionPerWorkshopFirstOffer: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      />
                      <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerWorkshopFirstOffer / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium mb-2">📧 Was passiert beim Freischalten:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>✓ Influencer-Account wird erstellt</li>
                <li>✓ Welcome-E-Mail mit Login-Daten wird versendet</li>
                <li>✓ Tracking-Link wird generiert</li>
                <li>✓ Individuelle Provisionen werden gespeichert</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Wird freigeschaltet...' : '✅ Jetzt freischalten'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
