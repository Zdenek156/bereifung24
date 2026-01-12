'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { checkEmployeePermission } from '@/lib/permissions'

interface ProcurementRequest {
  id: string
  requestNumber: string
  title: string
  category: string
  estimatedPrice: number
  urgency: string
  costCenter: string
  status: string
  requestedBy: {
    firstName: string
    lastName: string
  }
  supplier?: {
    name: string
  }
  createdAt: string
}

export default function RequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<ProcurementRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    
    const checkAccess = async () => {
      if (!session) {
        router.push('/admin')
        return
      }
      
      if (session.user.role === 'ADMIN') {
        fetchRequests()
        return
      }
      
      if (session.user.role === 'B24_EMPLOYEE') {
        const hasAccess = await checkEmployeePermission(session.user.id, 'procurement', 'read')
        if (hasAccess) {
          fetchRequests()
        } else {
          router.push('/mitarbeiter')
        }
      } else {
        router.push('/admin')
      }
    }
    
    checkAccess()
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/procurement/requests')
      const data = await response.json()
      if (response.ok) {
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ORDERED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      PENDING: 'Ausstehend',
      APPROVED: 'Genehmigt',
      REJECTED: 'Abgelehnt',
      ORDERED: 'Bestellt',
      COMPLETED: 'Abgeschlossen',
      CANCELLED: 'Storniert'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter)

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bedarfsanforderungen</h1>
              <p className="mt-1 text-sm text-gray-600">Anfragen erstellen und genehmigen</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/procurement" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Zurück
              </Link>
              <button 
                onClick={() => router.push('/admin/procurement/requests/new')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Neue Anfrage
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Alle ({requests.length})
            </button>
            <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-lg ${filter === 'PENDING' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Ausstehend ({requests.filter(r => r.status === 'PENDING').length})
            </button>
            <button onClick={() => setFilter('APPROVED')} className={`px-4 py-2 rounded-lg ${filter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Genehmigt ({requests.filter(r => r.status === 'APPROVED').length})
            </button>
            <button onClick={() => setFilter('ORDERED')} className={`px-4 py-2 rounded-lg ${filter === 'ORDERED' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Bestellt ({requests.filter(r => r.status === 'ORDERED').length})
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nummer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betrag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kostenstelle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Angefordert von</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Lädt...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Keine Anfragen gefunden</td></tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.requestNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{request.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.estimatedPrice.toFixed(2)} €</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.costCenter}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.requestedBy.firstName} {request.requestedBy.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/admin/procurement/requests/${request.id}`} className="text-emerald-600 hover:text-emerald-900">
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
