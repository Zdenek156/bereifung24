'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Payment {
  id: string
  periodStart: string
  periodEnd: string
  totalAmount: number
  clicksAmount: number
  registrationsAmount: number
  offersAmount: number
  totalClicks: number
  totalRegistrations: number
  totalOffers: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
  paymentMethod: 'BANK_TRANSFER' | 'PAYPAL'
  paymentReference: string | null
  createdAt: string
  paidAt: string | null
  influencer: {
    id: string
    email: string
    code: string
    channelName: string | null
    platform: string | null
    paymentMethod: 'BANK_TRANSFER' | 'PAYPAL'
    iban: string | null
    bic: string | null
    accountHolder: string | null
    paypalEmail: string | null
  }
}

export default function InfluencerPaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'>('PENDING')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadPayments()
    }
  }, [status, router])

  const loadPayments = async () => {
    try {
      setLoading(true)
      // Load ALL payments for proper counting
      const response = await fetch('/api/admin/influencer-payments')
      if (response.ok) {
        const data = await response.json()
        setAllPayments(data.payments)
      }
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (paymentId: string, status: string, paymentReference?: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/influencer-payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, paymentReference })
      })

      if (response.ok) {
        await loadPayments()
        setShowDetailsModal(false)
        setSelectedPayment(null)
      } else {
        alert('Fehler beim Aktualisieren')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Fehler beim Aktualisieren')
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    const labels = {
      PENDING: 'Ausstehend',
      APPROVED: 'Genehmigt',
      PAID: 'Bezahlt',
      CANCELLED: 'Storniert'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    return method === 'BANK_TRANSFER' ? 'Überweisung' : 'PayPal'
  }

  // Calculate counts for each status from ALL payments
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING')
  const approvedPayments = allPayments.filter(p => p.status === 'APPROVED')
  const paidPayments = allPayments.filter(p => p.status === 'PAID')
  const cancelledPayments = allPayments.filter(p => p.status === 'CANCELLED')
  
  const pendingCount = pendingPayments.length
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0)

  // Filter payments based on selected tab
  const filteredPayments = filter === 'ALL' 
    ? allPayments 
    : allPayments.filter(p => p.status === filter)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Auszahlungen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Influencer Auszahlungen</h1>
          <p className="mt-2 text-gray-600">
            Verwalte Auszahlungsanfragen von Influencern
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Offene Anfragen</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600">{pendingCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Offener Betrag</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{formatCurrency(totalPending)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Gesamt Auszahlungen</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{allPayments.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Alle</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === 'ALL' ? 'bg-blue-700' : 'bg-gray-200'
                }`}>
                  {allPayments.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  filter === 'PENDING'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Ausstehend</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === 'PENDING' ? 'bg-blue-700' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {pendingPayments.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  filter === 'APPROVED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Genehmigt</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === 'APPROVED' ? 'bg-blue-700' : 'bg-blue-200 text-blue-800'
                }`}>
                  {approvedPayments.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('PAID')}
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  filter === 'PAID'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Bezahlt</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === 'PAID' ? 'bg-blue-700' : 'bg-green-200 text-green-800'
                }`}>
                  {paidPayments.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('CANCELLED')}
                className={`px-4 py-2 rounded flex items-center gap-2 ${
                  filter === 'CANCELLED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Storniert</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === 'CANCELLED' ? 'bg-blue-700' : 'bg-red-200 text-red-800'
                }`}>
                  {cancelledPayments.length}
                </span>
              </button>
            </div>
          </div>

          {/* Payments List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Influencer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zeitraum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Methode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Angefordert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.influencer.channelName || payment.influencer.email}
                      </div>
                      <div className="text-sm text-gray-500">{payment.influencer.code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.totalClicks} Klicks, {payment.totalRegistrations} Reg., {payment.totalOffers} Angebote
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Keine Auszahlungen gefunden</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Auszahlungsdetails</h2>
                  <p className="text-gray-600 mt-1">ID: {selectedPayment.id}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedPayment(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Influencer Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Influencer</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <div className="font-medium">{selectedPayment.influencer.channelName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <div className="font-medium">{selectedPayment.influencer.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Code:</span>
                    <div className="font-medium">{selectedPayment.influencer.code}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Plattform:</span>
                    <div className="font-medium">{selectedPayment.influencer.platform || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Zahlungsdetails</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Zeitraum:</span>
                    <div className="font-medium">
                      {formatDate(selectedPayment.periodStart)} - {formatDate(selectedPayment.periodEnd)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Gesamtbetrag:</span>
                    <div className="font-bold text-lg text-blue-600">
                      {formatCurrency(selectedPayment.totalAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Klicks:</span>
                    <div className="font-medium">
                      {selectedPayment.totalClicks} × {formatCurrency(selectedPayment.clicksAmount / selectedPayment.totalClicks || 0)}
                      {' = '}
                      {formatCurrency(selectedPayment.clicksAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Registrierungen:</span>
                    <div className="font-medium">
                      {selectedPayment.totalRegistrations} × {formatCurrency(selectedPayment.registrationsAmount / selectedPayment.totalRegistrations || 0)}
                      {' = '}
                      {formatCurrency(selectedPayment.registrationsAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Angebote:</span>
                    <div className="font-medium">
                      {selectedPayment.totalOffers} × {formatCurrency(selectedPayment.offersAmount / selectedPayment.totalOffers || 0)}
                      {' = '}
                      {formatCurrency(selectedPayment.offersAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                </div>
              </div>

              {/* Payment Method Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Zahlungsinformationen</h3>
                {selectedPayment.paymentMethod === 'BANK_TRANSFER' ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Kontoinhaber:</span>
                      <div className="font-medium">{selectedPayment.influencer.accountHolder || '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">IBAN:</span>
                      <div className="font-medium font-mono">{selectedPayment.influencer.iban || '-'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">BIC:</span>
                      <div className="font-medium font-mono">{selectedPayment.influencer.bic || '-'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="text-gray-500">PayPal Email:</span>
                    <div className="font-medium">{selectedPayment.influencer.paypalEmail || '-'}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedPayment.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updatePaymentStatus(selectedPayment.id, 'APPROVED')}
                    disabled={updating}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    ✓ Genehmigen
                  </button>
                  <button
                    onClick={() => {
                      const ref = prompt('Zahlungsreferenz (z.B. Transaktions-ID):')
                      if (ref) updatePaymentStatus(selectedPayment.id, 'PAID', ref)
                    }}
                    disabled={updating}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    💰 Als bezahlt markieren
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Wirklich stornieren?')) {
                        updatePaymentStatus(selectedPayment.id, 'CANCELLED')
                      }
                    }}
                    disabled={updating}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    Stornieren
                  </button>
                </div>
              )}

              {selectedPayment.status === 'APPROVED' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const ref = prompt('Zahlungsreferenz (z.B. Transaktions-ID):')
                      if (ref) updatePaymentStatus(selectedPayment.id, 'PAID', ref)
                    }}
                    disabled={updating}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    💰 Als bezahlt markieren
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Wirklich stornieren?')) {
                        updatePaymentStatus(selectedPayment.id, 'CANCELLED')
                      }
                    }}
                    disabled={updating}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    Stornieren
                  </button>
                </div>
              )}

              {selectedPayment.status === 'PAID' && (
                <div className="text-center p-4 bg-green-50 rounded">
                  <div className="text-green-600 font-semibold">✓ Bezahlt</div>
                  {selectedPayment.paidAt && (
                    <div className="text-sm text-gray-600 mt-1">
                      am {formatDate(selectedPayment.paidAt)}
                    </div>
                  )}
                  {selectedPayment.paymentReference && (
                    <div className="text-sm text-gray-600 mt-1">
                      Referenz: {selectedPayment.paymentReference}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
