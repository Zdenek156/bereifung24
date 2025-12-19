'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WorkshopCRMDialog } from '@/components/WorkshopCRMDialog'

interface Workshop {
  id: string
  companyName: string
  isVerified: boolean
  createdAt: string
  distance: number | null
  offersCount: number
  revenue: number
  user: {
    email: string
    firstName: string
    lastName: string
    phone: string
    street: string
    zipCode: string
    city: string
  }
}

type SortOption = 'recent' | 'distance' | 'offers' | 'revenue'

export default function WorkshopManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [crmDialogOpen, setCrmDialogOpen] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchWorkshops()
  }, [session, status, router, sortBy])

  const fetchWorkshops = async () => {
    try {
      const response = await fetch(`/api/admin/workshops?sortBy=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        setWorkshops(data)
      }
    } catch (error) {
      console.error('Error fetching workshops:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (workshopId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/workshops/${workshopId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: !currentStatus
        }),
      })

      if (response.ok) {
        // Refresh workshops list
        fetchWorkshops()
      } else {
        alert('Fehler beim Aktualisieren der Werkstatt')
      }
    } catch (error) {
      console.error('Error updating workshop:', error)
      alert('Fehler beim Aktualisieren der Werkstatt')
    }
  }

  const deleteWorkshop = async (workshopId: string, workshopName: string) => {
    const confirmed = window.confirm(
      `Möchtest du die Werkstatt "${workshopName}" wirklich endgültig löschen?\n\n` +
      `Alle zugehörigen Daten (Angebote, Termine, Bewertungen etc.) werden ebenfalls gelöscht.\n\n` +
      `Diese Aktion kann nicht rückgängig gemacht werden!`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/workshops/${workshopId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Werkstatt erfolgreich gelöscht')
        fetchWorkshops()
      } else {
        alert('Fehler beim Löschen der Werkstatt')
      }
    } catch (error) {
      console.error('Error deleting workshop:', error)
      alert('Fehler beim Löschen der Werkstatt')
    }
  }

  const filteredWorkshops = workshops
    .filter(workshop => {
      if (filter === 'verified') return workshop.isVerified
      if (filter === 'pending') return !workshop.isVerified
      return true
    })
    .filter(workshop => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        workshop.companyName.toLowerCase().includes(term) ||
        workshop.user.email.toLowerCase().includes(term) ||
        workshop.user.city.toLowerCase().includes(term)
      )
    })

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
                ← Zurück zum Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Werkstattverwaltung
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {workshops.length} Werkstätten registriert
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters, Search and Download */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Firmenname, E-Mail oder Stadt..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'verified' | 'pending')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Alle Werkstätten</option>
                <option value="verified">Freigeschaltet</option>
                <option value="pending">Wartend</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sortierung
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="recent">Zuletzt registriert</option>
                <option value="distance">Entfernung</option>
                <option value="offers">Anzahl Angebote</option>
                <option value="revenue">Umsatz</option>
              </select>
            </div>

            {/* Download */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export
              </label>
              <div className="flex gap-2">
                <a
                  href="/api/admin/workshops/download?format=csv"
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-1"
                  download
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </a>
                <a
                  href="/api/admin/workshops/download?format=txt"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                  download
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  TXT
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Gesamt</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{workshops.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Freigeschaltet</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {workshops.filter(w => w.isVerified).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Wartend</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {workshops.filter(w => !w.isVerified).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Gesamt Umsatz</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {workshops.reduce((sum, w) => sum + w.revenue, 0).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </p>
          </div>
        </div>

        {/* Workshops List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Keine Werkstätten gefunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkshops.map((workshop) => (
              <div key={workshop.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {workshop.companyName}
                        </h3>
                        {workshop.isVerified ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Freigeschaltet
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                            Wartend
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <strong>Kontakt:</strong> {workshop.user.firstName} {workshop.user.lastName}
                          </p>
                          <p className="text-gray-600">
                            <strong>E-Mail:</strong> {workshop.user.email}
                          </p>
                          <p className="text-gray-600">
                            <strong>Telefon:</strong> {workshop.user.phone || 'Nicht angegeben'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            <strong>Adresse:</strong><br />
                            {workshop.user.street}<br />
                            {workshop.user.zipCode} {workshop.user.city}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500">
                        <p>
                          <strong>Registriert:</strong><br />
                          {new Date(workshop.createdAt).toLocaleDateString('de-DE')}
                        </p>
                        <p>
                          <strong>Entfernung:</strong><br />
                          {workshop.distance ? `${workshop.distance} km` : '-'}
                        </p>
                        <p>
                          <strong>Angebote:</strong><br />
                          {workshop.offersCount}
                        </p>
                        <p>
                          <strong>Umsatz:</strong><br />
                          {workshop.revenue.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedWorkshop({ id: workshop.id, name: workshop.companyName })
                          setCrmDialogOpen(true)
                        }}
                        className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        CRM / Notizen
                      </button>
                      <button
                        onClick={() => toggleVerification(workshop.id, workshop.isVerified)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          workshop.isVerified
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {workshop.isVerified ? 'Sperren' : 'Freischalten'}
                      </button>
                      <button
                        onClick={() => deleteWorkshop(workshop.id, workshop.companyName)}
                        className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CRM Dialog */}
      {selectedWorkshop && (
        <WorkshopCRMDialog
          open={crmDialogOpen}
          onOpenChange={setCrmDialogOpen}
          workshopId={selectedWorkshop.id}
          workshopName={selectedWorkshop.name}
        />
      )}
    </div>
  )
}
