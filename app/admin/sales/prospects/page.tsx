'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, MapPin, Phone, Globe, Star } from 'lucide-react'
import Link from 'next/link'
import ProspectDetailDialog from '@/components/ProspectDetailDialog'

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
  }, [status, session, router])

  const fetchProspects = async () => {
    try {
      const response = await fetch('/api/sales/prospects')
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
              <button
                onClick={() => router.push('/admin/sales')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meine Prospects</h1>
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prospect.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {prospect.address}
                        </div>
                        <div className="text-sm text-gray-600">
                          {prospect.postalCode} {prospect.city}
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
                            lng: prospect.longitude
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
