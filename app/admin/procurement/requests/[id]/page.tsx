'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Request {
  id: string
  requestNumber: string
  title: string
  description: string
  category: string
  estimatedPrice: number
  urgency: string
  costCenter: string
  status: string
  requestedBy: {
    firstName: string
    lastName: string
    email: string
  }
  supplier?: {
    id: string
    name: string
  }
  approvedBy?: {
    firstName: string
    lastName: string
  }
  approvedAt?: string
  rejectionReason?: string
  order?: {
    orderNumber: string
    id: string
  }
  createdAt: string
  updatedAt: string
}

export default function RequestDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin')
      return
    }
    fetchRequest()
  }, [session, status, router, params.id])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/admin/procurement/requests/${params.id}`)
      const data = await response.json()
      if (response.ok) {
        setRequest(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Anfrage genehmigen?')) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/procurement/requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })
      if (response.ok) {
        alert('Anfrage genehmigt')
        fetchRequest()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt('Ablehnungsgrund:')
    if (!reason) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/procurement/requests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason })
      })
      if (response.ok) {
        alert('Anfrage abgelehnt')
        fetchRequest()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Anfrage wirklich löschen?')) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/procurement/requests/${params.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        alert('Anfrage gelöscht')
        router.push('/admin/procurement/requests')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  }

  if (!request) {
    return <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900">Anfrage nicht gefunden</h1>
      </div>
    </div>
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ORDERED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/admin/procurement/requests" className="text-sm text-gray-600 hover:text-gray-900">← Zurück</Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{request.requestNumber}</h1>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[request.status as keyof typeof statusColors]}`}>
              {request.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{request.title}</h2>
          <p className="text-gray-700 mb-6">{request.description || 'Keine Beschreibung'}</p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Kategorie</label>
              <p className="text-gray-900">{request.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Geschätzter Preis</label>
              <p className="text-gray-900 font-semibold">{request.estimatedPrice.toFixed(2)} €</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Dringlichkeit</label>
              <p className="text-gray-900">{request.urgency}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Kostenstelle</label>
              <p className="text-gray-900">{request.costCenter}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Angefordert von</label>
              <p className="text-gray-900">{request.requestedBy.firstName} {request.requestedBy.lastName}</p>
              <p className="text-sm text-gray-600">{request.requestedBy.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Datum</label>
              <p className="text-gray-900">{new Date(request.createdAt).toLocaleDateString('de-DE')}</p>
            </div>
          </div>

          {request.supplier && (
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-gray-500">Lieferant</label>
              <p className="text-gray-900">{request.supplier.name}</p>
            </div>
          )}

          {request.approvedBy && (
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-gray-500">Genehmigt von</label>
              <p className="text-gray-900">{request.approvedBy.firstName} {request.approvedBy.lastName}</p>
              <p className="text-sm text-gray-600">{new Date(request.approvedAt!).toLocaleDateString('de-DE')}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-red-500">Ablehnungsgrund</label>
              <p className="text-gray-900">{request.rejectionReason}</p>
            </div>
          )}

          {request.order && (
            <div className="mt-6 pt-6 border-t">
              <label className="text-sm font-medium text-gray-500">Bestellung</label>
              <Link href={`/admin/procurement/orders/${request.order.id}`} className="text-emerald-600 hover:text-emerald-900">
                {request.order.orderNumber} →
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        {request.status === 'PENDING' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktionen</h3>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Genehmigen
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Ablehnen
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Löschen
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
