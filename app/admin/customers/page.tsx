'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  street: string | null
  city: string | null
  zipCode: string | null
  distance: number | null
  requestCount: number
  totalSpent: number
  createdAt: string
  isActive: boolean
}

type SortOption = 'recent' | 'distance' | 'requests' | 'revenue'

export default function AdminCustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    fetchCustomers()
  }, [session, status, router, sortBy])

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/admin/customers?sortBy=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      
      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const deleteCustomer = async (customerId: string, customerName: string) => {
    const confirmed = window.confirm(
      `Möchtest du den Kunden "${customerName}" wirklich endgültig löschen?\n\n` +
      `Alle zugehörigen Daten (Anfragen, Buchungen, Fahrzeuge etc.) werden ebenfalls gelöscht.\n\n` +
      `Diese Aktion kann nicht rückgängig gemacht werden!`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Kunde erfolgreich gelöscht')
        fetchCustomers()
      } else {
        alert('Fehler beim Löschen des Kunden')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Fehler beim Löschen des Kunden')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
          <p className="text-gray-600 mt-2">Übersicht aller registrierten Kunden</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Gesamt Kunden</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Aktive Kunden</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {customers.filter(c => c.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Gesamt Anfragen</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {customers.reduce((sum, c) => sum + c.requestCount, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Gesamt Umsatz</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </div>
        </div>

        {/* Filters and Download */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Suche nach Name oder E-Mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="recent">Zuletzt registriert</option>
                <option value="distance">Entfernung</option>
                <option value="requests">Anzahl Anfragen</option>
                <option value="revenue">Umsatz</option>
              </select>
            </div>
            <div className="flex gap-2">
              <a
                href="/api/admin/customers/download?format=csv"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                download
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </a>
              <a
                href="/api/admin/customers/download?format=txt"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                download
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TXT
              </a>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Lade Kunden...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Keine Kunden gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entfernung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anfragen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Umsatz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registriert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.street && <div>{customer.street}</div>}
                          {customer.city ? `${customer.zipCode} ${customer.city}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.distance ? `${customer.distance} km` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.requestCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.totalSpent.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => toggleCustomerStatus(customer.id, customer.isActive)}
                            className={`${
                              customer.isActive
                                ? 'text-orange-600 hover:text-orange-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {customer.isActive ? 'Deaktivieren' : 'Aktivieren'}
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id, `${customer.firstName} ${customer.lastName}`)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
