'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wrench, Search, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'

interface Workshop {
  id: string
  email: string
  companyName: string
  phone?: string
  city?: string
  isApproved: boolean
  createdAt: string
  _count?: {
    offers: number
  }
}

export default function MitarbeiterWorkshopsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
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
      const response = await fetch('/api/employee/has-application?key=workshops')
      if (response.ok) {
        const result = await response.json()
        if (result.hasAccess) {
          setHasAccess(true)
          fetchWorkshops()
        } else {
          router.push('/mitarbeiter')
        }
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/mitarbeiter')
    }
  }

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('/api/admin/workshops')
      if (response.ok) {
        const result = await response.json()
        setWorkshops(result || [])
      }
    } catch (error) {
      console.error('Error fetching workshops:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkshops = workshops.filter((workshop) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      workshop.companyName.toLowerCase().includes(search) ||
      workshop.email.toLowerCase().includes(search) ||
      workshop.city?.toLowerCase().includes(search) ||
      workshop.phone?.includes(search)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'approved' && workshop.isApproved) ||
      (filter === 'pending' && !workshop.isApproved)

    return matchesSearch && matchesFilter
  })

  if (status === 'loading' || loading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const approvedCount = workshops.filter((w) => w.isApproved).length
  const pendingCount = workshops.filter((w) => !w.isApproved).length

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
              <h1 className="text-3xl font-bold text-gray-900">Werkstattverwaltung</h1>
              <p className="text-gray-600 mt-1">
                {approvedCount} freigeschaltet · {pendingCount} warten auf Freischaltung
              </p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Name, E-Mail, Stadt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              Alle ({workshops.length})
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              onClick={() => setFilter('approved')}
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Freigeschaltet ({approvedCount})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              size="sm"
            >
              <Clock className="h-4 w-4 mr-1" />
              Ausstehend ({pendingCount})
            </Button>
          </div>
        </div>

        {filteredWorkshops.length === 0 && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Wrench className="h-16 w-16 mx-auto text-gray-400" />
              <h2 className="text-2xl font-bold">
                {searchTerm ? 'Keine Ergebnisse' : 'Keine Werkstätten'}
              </h2>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Keine Werkstätten gefunden, die Ihrer Suche entsprechen.'
                  : 'Es sind noch keine Werkstätten registriert.'}
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          {filteredWorkshops.map((workshop) => (
            <Card key={workshop.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {workshop.companyName}
                    </h3>
                    {workshop.isApproved ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Freigeschaltet
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ausstehend
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📧 {workshop.email}</p>
                    {workshop.phone && <p>📱 {workshop.phone}</p>}
                    {workshop.city && <p>📍 {workshop.city}</p>}
                    <p className="text-xs text-gray-500">
                      Registriert: {new Date(workshop.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  {workshop._count && (
                    <div className="mt-3 text-sm text-gray-600">
                      📝 {workshop._count.offers || 0} Angebote erstellt
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
