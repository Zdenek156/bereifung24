'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  supplier: {
    name: string
  }
  orderedBy: {
    firstName: string
    lastName: string
  }
  totalNet: number
  totalGross: number
  status: string
  orderDate: string
  deliveryDate?: string
  _count: {
    items: number
  }
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    const checkAccess = async () => {
      if (!session) {
        router.push('/admin')
        return
      }
      
      if (session.user.role === 'ADMIN') {
        fetchOrders()
        return
      }
      
      if (session.user.role === 'B24_EMPLOYEE') {
        const response = await fetch('/api/employee/check-permission?resource=procurement&action=read')
        const { hasPermission } = await response.json()
        if (hasPermission) {
          fetchOrders()
        } else {
          router.push('/mitarbeiter')
        }
      } else {
        router.push('/admin')
      }
    }
    
    checkAccess()
  }, [session, status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/procurement/orders')
      const data = await response.json()
      if (response.ok) {
        setOrders(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ORDERED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    INVOICED: 'bg-teal-100 text-teal-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }

  const statusLabels = {
    DRAFT: 'Entwurf',
    ORDERED: 'Bestellt',
    CONFIRMED: 'Bestätigt',
    SHIPPED: 'Versendet',
    DELIVERED: 'Geliefert',
    INVOICED: 'Berechnet',
    PAID: 'Bezahlt',
    CANCELLED: 'Storniert'
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Bestellungen</h1>
              <p className="mt-1 text-sm text-gray-600">Alle Bestellungen verwalten</p>
            </div>
            <Link href="/admin/procurement" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Zurück
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bestellnummer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lieferant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positionen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betrag (Brutto)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bestellt von</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Lädt...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Keine Bestellungen gefunden</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.supplier.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order._count.items}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {order.totalGross.toFixed(2)} €
                      <div className="text-xs text-gray-500">Netto: {order.totalNet.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.orderedBy.firstName} {order.orderedBy.lastName}
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
