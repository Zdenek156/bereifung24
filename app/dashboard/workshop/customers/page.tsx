'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Search, Filter, Download, Mail, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'

interface Customer {
  id: string
  customerType: string
  firstName: string
  lastName: string
  companyName?: string
  email?: string
  phone?: string
  city?: string
  totalBookings: number
  totalRevenue: number
  lastBookingDate?: string
  source: string
  createdAt: string
}

export default function WorkshopCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSource, setFilterSource] = useState<string>('ALL')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/workshop/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      searchTerm === '' ||
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSource = filterSource === 'ALL' || customer.source === filterSource

    return matchesSearch && matchesSource
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('de-DE')
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'BEREIFUNG24_BOOKING':
        return 'bg-green-100 text-green-800'
      case 'BEREIFUNG24_MANUAL_APPOINTMENT':
        return 'bg-blue-100 text-blue-800'
      case 'MANUAL':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'BEREIFUNG24_BOOKING':
        return 'Bereifung24 Buchung'
      case 'BEREIFUNG24_MANUAL_APPOINTMENT':
        return 'Manueller Termin'
      case 'MANUAL':
        return 'Manuell'
      default:
        return source
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Kunden...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Kundenverwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Kunde' : 'Kunden'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/dashboard/workshop/customers/new')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Suche nach Name, Email, Telefon oder Firma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Alle Quellen</option>
              <option value="BEREIFUNG24_BOOKING">Bereifung24 Buchung</option>
              <option value="BEREIFUNG24_MANUAL_APPOINTMENT">Manueller Termin</option>
              <option value="MANUAL">Manuell erstellt</option>
            </select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Keine Kunden gefunden</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterSource !== 'ALL'
              ? 'Versuchen Sie es mit anderen Filterkriterien'
              : 'Erstellen Sie Ihren ersten Kunden oder warten Sie auf die erste Buchung'}
          </p>
          {!searchTerm && filterSource === 'ALL' && (
            <Button
              onClick={() => router.push('/dashboard/workshop/customers/new')}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ersten Kunden anlegen
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quelle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/workshop/customers/${customer.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.customerType === 'BUSINESS' && customer.companyName
                            ? customer.companyName
                            : `${customer.firstName} ${customer.lastName}`}
                        </div>
                        {customer.customerType === 'BUSINESS' && customer.companyName && (
                          <div className="text-sm text-gray-500">
                            {customer.firstName} {customer.lastName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{customer.city || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {customer.totalBookings} Buchungen
                        </div>
                        <div className="text-gray-600">{formatCurrency(customer.totalRevenue)}</div>
                        {customer.lastBookingDate && (
                          <div className="text-xs text-gray-500">
                            Letzte: {formatDate(customer.lastBookingDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(
                          customer.source
                        )}`}
                      >
                        {getSourceLabel(customer.source)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/workshop/customers/${customer.id}`)
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
