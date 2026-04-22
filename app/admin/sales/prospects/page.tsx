'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MapPin, Phone, Globe, Star, Info, Bell, X } from 'lucide-react'
import Link from 'next/link'
import ProspectDetailDialog from '@/components/ProspectDetailDialog'
import BackButton from '@/components/BackButton'

interface Prospect {
  id: string
  googlePlaceId: string
  name: string
  city: string
  postalCode: string
  address: string
  phone?: string
  website?: string
  email?: string
  rating?: number
  reviewCount: number
  status: string
  priority: string
  leadScore: number
  latitude: number
  longitude: number
  photoUrls?: string[]
  openingHours?: any
  priceLevel?: number
  leadScoreBreakdown?: { label: string; points: number }[]
}

const statusLabels: Record<string, string> = {
  NEW: 'Neu',
  CONTACTED: 'Kontaktiert',
  QUALIFIED: 'Qualifiziert',
  WON: 'Gewonnen',
  LOST: 'Verloren'
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-gray-100 text-gray-800'
}

export default function ProspectsListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dueOnly = searchParams?.get('dueOnly') === 'true'
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user) {
      router.push('/login')
      return
    }
    
    fetchProspects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, dueOnly])

  const fetchProspects = async () => {
    try {
      const url = dueOnly
        ? '/api/sales/prospects?dueOnly=true'
        : '/api/sales/prospects'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProspects(data.prospects || [])
      }
    } catch (error) {
      console.error('Error fetching prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {dueOnly ? 'Fällige Follow-ups' : 'Meine Prospects'}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {prospects.length} Werkstätten
                </p>
              </div>
            </div>
            <Link
              href="/admin/sales/search"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Neue suchen
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dueOnly && (
          <div className="mb-6 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-red-800">
              <Bell className="h-5 w-5" />
              <span className="font-medium">Filter aktiv: Nur überfällige Follow-ups</span>
            </div>
            <Link
              href="/mitarbeiter/sales/prospects"
              className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-900"
            >
              <X className="h-4 w-4" /> Filter entfernen
            </Link>
          </div>
        )}
        {prospects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Prospects vorhanden
            </h3>
            <p className="text-gray-600 mb-6">
              Starte eine Suche, um neue Werkstätten zu finden
            </p>
            <Link
              href="/admin/sales/search"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              Werkstätten suchen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {prospects.map((prospect) => (
              <div
                key={prospect.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {prospect.photoUrls && prospect.photoUrls.length > 0 ? (
                    <img
                      src={prospect.photoUrls[0]}
                      alt={prospect.name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                      loading="lazy"
                      onError={(e) => {
                        // Bei Lade-Fehler durch Fallback-Avatar ersetzen
                        const fallback = document.createElement('div')
                        fallback.className = 'w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0'
                        fallback.innerHTML = `<span class="text-3xl font-bold text-blue-600">${prospect.name.charAt(0).toUpperCase()}</span>`
                        e.currentTarget.replaceWith(fallback)
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl font-bold text-blue-600">
                        {prospect.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prospect.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {prospect.address}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {prospect.rating && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium">{prospect.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-600 ml-1">
                              ({prospect.reviewCount})
                            </span>
                          </div>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[prospect.priority]}`}>
                          {prospect.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {prospect.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {prospect.phone}
                        </div>
                      )}
                      {prospect.website && (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-700"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Status:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {statusLabels[prospect.status] || prospect.status}
                        </span>
                        <span className="text-xs text-gray-600">Lead Score:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {prospect.leadScore}/100
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProspect({
                            ...prospect,
                            placeId: prospect.googlePlaceId,
                            lat: prospect.latitude,
                            lng: prospect.longitude,
                            status: prospect.status
                          } as any)
                          setDetailDialogOpen(true)
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Info className="h-4 w-4" />
                        Details anzeigen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <ProspectDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        prospect={selectedProspect}
        onImport={fetchProspects}
      />
    </div>
  )
}
