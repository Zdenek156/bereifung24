'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TireRequest {
  id: string
  season: string
  width: number
  aspectRatio: number
  diameter: number
  loadIndex?: number
  speedRating?: string
  isRunflat: boolean
  quantity: number
  preferredBrands?: string
  additionalNotes?: string
  status: string
  needByDate: string
  zipCode: string
  radiusKm: number
  createdAt: string
  _count: {
    offers: number
  }
}

export default function RequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<TireRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'CUSTOMER') {
      router.push('/login')
      return
    }

    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/tire-requests')
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Offen' },
      QUOTED: { color: 'bg-blue-100 text-blue-800', text: 'Angebote vorhanden' },
      ACCEPTED: { color: 'bg-green-100 text-green-800', text: 'Angenommen' },
      COMPLETED: { color: 'bg-gray-100 text-gray-800', text: 'Abgeschlossen' },
      CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Abgebrochen' },
    }
    const badge = badges[status as keyof typeof badges] || badges.PENDING
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getSeasonEmoji = (season: string) => {
    const emojis = {
      SUMMER: '☀️',
      WINTER: '❄️',
      ALL_SEASON: '🌤️',
    }
    return emojis[season as keyof typeof emojis] || '🔵'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/customer"
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center inline-flex"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Meine Anfragen</h1>
              <p className="mt-2 text-lg text-gray-600">
                Übersicht aller Reifenanfragen und erhaltenen Angebote
              </p>
            </div>
            <Link
              href="/dashboard/customer/create-request"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              + Neue Anfrage
            </Link>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Noch keine Anfragen</h3>
            <p className="text-gray-600 mb-6">
              Erstellen Sie Ihre erste Reifenanfrage und erhalten Sie Angebote von Werkstätten in Ihrer Nähe
            </p>
            <Link
              href="/dashboard/customer/create-request"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Jetzt Anfrage erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {request.additionalNotes?.includes('🏍️ MOTORRADREIFEN') ? (
                            // Motorcycle tire request
                            <>
                              🏍️ Motorradreifen mit Montage {' '}
                              {request.season === 'SUMMER' && '☀️'}
                              {request.season === 'WINTER' && '❄️'}
                              {request.season === 'ALL_SEASON' && '🌤️'}
                            </>
                          ) : request.width === 0 && request.aspectRatio === 0 && request.diameter === 0 ? (
                            // Service request - detect type by keyword in additionalNotes
                            <>
                              {request.additionalNotes?.includes('KLIMASERVICE') && '❄️ Klimaservice'}
                              {request.additionalNotes?.includes('ACHSVERMESSUNG') && '📐 Achsvermessung / Spureinstellung'}
                              {request.additionalNotes?.includes('BREMSENWECHSEL') && '🔴 Bremsenwechsel'}
                              {request.additionalNotes?.includes('BATTERIEWECHSEL') && '🔋 Batteriewechsel'}
                              {request.additionalNotes?.includes('RÄDER UMSTECKEN') && '🔄 Räder umstecken (Sommer/Winter)'}
                              {request.additionalNotes?.includes('🔧 REPARATUR') && '🔧 Reifenreparatur'}
                              {request.additionalNotes?.includes('🛠️') && '🛠️ Sonstige Reifendienstleistungen'}
                              {!request.additionalNotes?.includes('KLIMASERVICE') && !request.additionalNotes?.includes('ACHSVERMESSUNG') && !request.additionalNotes?.includes('BREMSENWECHSEL') && !request.additionalNotes?.includes('BATTERIEWECHSEL') && !request.additionalNotes?.includes('RÄDER UMSTECKEN') && !request.additionalNotes?.includes('🔧 REPARATUR') && !request.additionalNotes?.includes('🛠️') && '🔧 Service-Anfrage'}
                            </>
                          ) : (
                            // Regular car tire request
                            <>
                              🚗 Autoreifen mit Montage {' '}
                              {request.season === 'SUMMER' && '☀️'}
                              {request.season === 'WINTER' && '❄️'}
                              {request.season === 'ALL_SEASON' && '🌤️'}
                            </>
                          )}
                        </h3>
                        
                        {/* Tire dimensions - smaller text below title */}
                        {request.width !== 0 && (
                          <>
                            <p className="text-sm text-gray-700 mt-1 font-medium">
                              {request.additionalNotes?.includes('🏍️ MOTORRADREIFEN') ? (
                                // Motorcycle - show front and rear
                                <>
                                  {(() => {
                                    // Parse additionalNotes to get front and rear tire dimensions with load index and speed rating
                                    const frontMatch = request.additionalNotes?.match(/✓ Vorderreifen: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                                    const rearMatch = request.additionalNotes?.match(/✓ Hinterreifen: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                                    
                                    if (frontMatch && rearMatch) {
                                      return `Vorne: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] ? ' ' + frontMatch[4] : ''}${frontMatch[5] ? ' ' + frontMatch[5] : ''} • Hinten: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] ? ' ' + rearMatch[4] : ''}${rearMatch[5] ? ' ' + rearMatch[5] : ''}`
                                    } else if (frontMatch) {
                                      return `Vorderreifen: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] ? ' ' + frontMatch[4] : ''}${frontMatch[5] ? ' ' + frontMatch[5] : ''}`
                                    } else if (rearMatch) {
                                      return `Hinterreifen: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] ? ' ' + rearMatch[4] : ''}${rearMatch[5] ? ' ' + rearMatch[5] : ''}`
                                    }
                                    // Fallback to primary dimensions
                                    return `${request.width}/${request.aspectRatio} R${request.diameter}${request.loadIndex ? ' ' + request.loadIndex : ''}${request.speedRating || ''}`
                                  })()}
                                </>
                              ) : (
                                // Car tires - check for front/rear or show single dimension
                                <>
                                  {(() => {
                                    const frontMatch = request.additionalNotes?.match(/Vorderachse: (\d+)\/(\d+) R(\d+)/)
                                    const rearMatch = request.additionalNotes?.match(/Hinterachse: (\d+)\/(\d+) R(\d+)/)
                                    
                                    if (frontMatch && rearMatch) {
                                      return `Vorne: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]} • Hinten: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}`
                                    } else if (frontMatch) {
                                      return `Vorderachse: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}`
                                    } else if (rearMatch) {
                                      return `Hinterachse: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}`
                                    }
                                    // Standard display
                                    return `${request.width}/${request.aspectRatio} R${request.diameter}${request.loadIndex ? ' ' + request.loadIndex : ''}${request.speedRating || ''}`
                                  })()}
                                  {request.isRunflat && ' • Runflat'}
                                </>
                              )}
                            </p>
                            
                            {/* Additional tire details */}
                            {request.additionalNotes && (
                              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                {request.additionalNotes.includes('✓ Altreifenentsorgung') && (
                                  <div>✓ Altreifenentsorgung gewünscht</div>
                                )}
                                {request.additionalNotes.includes('Run-Flat') && (
                                  <div>✓ Run-Flat Reifen</div>
                                )}
                                {request.preferredBrands && (
                                  <div>Bevorzugte Marken: {request.preferredBrands}</div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {request.width === 0 ? 'Service-Anfrage' : request.additionalNotes?.includes('🏍️ MOTORRADREIFEN') ? `Motorradreifen • ${request.quantity} Stück` : `${request.quantity} Reifen`} • Erstellt am {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        PLZ {request.zipCode} ({request.radiusKm} km)
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Benötigt bis {formatDate(request.needByDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {request._count.offers} Angebot{request._count.offers !== 1 ? 'e' : ''}
                      </div>
                    </div>

                    {request.preferredBrands && request.width !== 0 && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Bevorzugte Hersteller:</strong> {request.preferredBrands}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(request.status)}
                    <Link
                      href={`/dashboard/customer/requests/${request.id}`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
