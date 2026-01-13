'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Search, Filter, Download, Plus, ArrowLeft } from 'lucide-react'

interface Customer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  createdAt: string
  _count?: {
    tireRequests: number
    vehicles: number
  }
}

export default function MitarbeiterCustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/mitarbeiter/login')
      return
    }

    if (session.user.role !== 'B24_EMPLOYEE') {
      router.push('/mitarbeiter')
      return
    }

    checkAccess()
  }, [session, status, router])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/employee/has-application?key=customers')
      if (response.ok) {
        const result = await response.json()
        if (result.hasAccess) {
          setHasAccess(true)
          fetchCustomers()
        } else {
          router.push('/mitarbeiter')
        }
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/mitarbeiter')
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers')
      if (response.ok) {
        const result = await response.json()
        setCustomers(result.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase()
    return (
      customer.email.toLowerCase().includes(search) ||
      customer.firstName?.toLowerCase().includes(search) ||
      customer.lastName?.toLowerCase().includes(search) ||
      customer.phone?.includes(search)
    )
  })

  if (status === 'loading' || loading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/mitarbeiter')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
              <p className="text-gray-600 mt-1">
                {customers.length} registrierte Kunden
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Name, E-Mail oder Telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Users className="h-16 w-16 mx-auto text-gray-400" />
              <h2 className="text-2xl font-bold">
                {searchTerm ? 'Keine Ergebnisse' : 'Keine Kunden'}
              </h2>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Keine Kunden gefunden, die Ihrer Suche entsprechen.'
                  : 'Es sind noch keine Kunden registriert.'}
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.firstName && customer.lastName
                        ? `${customer.firstName} ${customer.lastName}`
                        : customer.email}
                    </h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📧 {customer.email}</p>
                    {customer.phone && <p>📱 {customer.phone}</p>}
                    <p className="text-xs text-gray-500">
                      Registriert: {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  {customer._count && (
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="text-gray-600">
                        🚗 {customer._count.vehicles || 0} Fahrzeuge
                      </span>
                      <span className="text-gray-600">
                        📝 {customer._count.tireRequests || 0} Anfragen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
