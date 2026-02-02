'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Offer {
  id: string
  tireBrand: string
  tireModel: string
  description: string | null
  price: number
  pricePerTire: number | null
  installationFee: number | null
  validUntil: string
  status: string
  acceptedAt: string | null
  declinedAt: string | null
  createdAt: string
  selectedTireOptionIds: string[]
  tireOptions: Array<{
    id: string
    brand: string
    model: string
    pricePerTire: number
    montagePrice: number | null
    carTireType: string | null
  }> | null
  tireRequest: {
    id: string
    season: string
    width: number
    aspectRatio: number
    diameter: number
    quantity: number
    zipCode: string
    needByDate: string
    additionalNotes: string | null
    customer: {
      user: {
        firstName: string
        lastName: string
        email: string
        phone: string | null
        city: string | null
        zipCode: string | null
        street: string | null
      }
    }
  }
  booking: any | null
}

export default function WorkshopOffers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [searchCode, setSearchCode] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }

    fetchOffers()
  }, [session, status, router])

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/workshop/offers')
      if (response.ok) {
        const data = await response.json()
        setOffers(data)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      PENDING: 'Ausstehend',
      ACCEPTED: 'Angenommen',
      DECLINED: 'Abgelehnt',
      EXPIRED: 'Abgelaufen',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  // Berechne Gesamtpreis für angenommene Angebote (Ersatzteile + Montage)
  const calculateTotalPrice = (offer: Offer) => {
    // Für angenommene Bremsen-Service Angebote: Summiere alle ausgewählten Optionen
    if (offer.status === 'ACCEPTED' && offer.tireOptions && offer.tireOptions.length > 0) {
      const notes = offer.tireRequest.additionalNotes || ''
      if (notes.includes('BREMSEN-SERVICE')) {
        let total = 0
        offer.tireOptions.forEach(option => {
          // Ersatzteilpreis
          total += option.pricePerTire
          // Montagepreis
          if (option.montagePrice) {
            total += option.montagePrice
          }
        })
        return total
      }
    }
    // Fallback: Standard-Preis
    return offer.price
  }

  const filteredOffers = offers.filter(offer => {
    // Filter by status
    if (filter !== 'all' && offer.status !== filter.toUpperCase()) {
      return false
    }
    
    // Filter by search code (last 4 characters of request ID)
    if (searchCode.trim() !== '') {
      const requestCode = offer.tireRequest.id.slice(-4).toUpperCase()
      return requestCode.includes(searchCode.toUpperCase())
    }
    
    return true
  })

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'PENDING').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    declined: offers.filter(o => o.status === 'DECLINED').length,
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meine Angebote</h1>
              <p className="mt-1 text-sm text-gray-600">
                Übersicht aller gesendeten Angebote
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Ausstehend</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Angenommen</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Abgelehnt</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.declined}</p>
          </div>
        </div>

        {/* Search by Code */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buchungs-Code suchen
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Code eingeben (z.B. 3R4R)"
              maxLength={4}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono uppercase bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
            {searchCode && (
              <button
                onClick={() => setSearchCode('')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Zurücksetzen
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Kunden erhalten einen 4-stelligen Code für telefonische Terminvereinbarungen
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ausstehend
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'accepted'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Angenommen
            </button>
            <button
              onClick={() => setFilter('declined')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'declined'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abgelehnt
            </button>
          </div>
        </div>

        {/* Offers List */}
        {filteredOffers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Keine Angebote</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'Sie haben noch keine Angebote versendet.'
                : `Keine ${filter === 'pending' ? 'ausstehenden' : filter === 'accepted' ? 'angenommenen' : 'abgelehnten'} Angebote.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <div key={offer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const notes = offer.tireRequest.additionalNotes || ''
                        
                        // Bremsen-Service
                        if (notes.includes('BREMSEN-SERVICE')) {
                          const front = notes.match(/Vorderachse:\s*([^\n]+)/)?.[1]?.trim()
                          const rear = notes.match(/Hinterachse:\s*([^\n]+)/)?.[1]?.trim()
                          const parts = []
                          if (front && front !== 'Keine Arbeiten') parts.push(`Vorne: ${front}`)
                          if (rear && rear !== 'Keine Arbeiten') parts.push(`Hinten: ${rear}`)
                          return `Bremsen-Service • ${parts.join(' • ')}`
                        }
                        
                        // Batterie-Service
                        if (notes.includes('BATTERIE-SERVICE')) {
                          return 'Batterie-Service'
                        }
                        
                        // Klimaservice
                        if (notes.includes('KLIMASERVICE')) {
                          return 'Klimaservice'
                        }
                        
                        // Achsvermessung
                        if (notes.includes('ACHSVERMESSUNG')) {
                          return 'Achsvermessung / Spureinstellung'
                        }
                        
                        // Räder umstecken
                        if (notes.includes('RÄDER UMSTECKEN')) {
                          return 'Räder umstecken (Sommer/Winter)'
                        }
                        
                        // Reifenreparatur
                        if (notes.includes('REIFENREPARATUR') || offer.tireRequest.width === 0) {
                          return 'Reifenreparatur'
                        }
                        
                        // Sonstiger Service
                        if (notes.includes('SONSTIGE REIFENSERVICES')) {
                          return 'Sonstiger Service'
                        }
                        
                        // Standard: Reifen
                        return `${offer.tireRequest.width}/${offer.tireRequest.aspectRatio} R${offer.tireRequest.diameter} • ${
                          offer.tireRequest.season === 'SUMMER' ? 'Sommerreifen' : 
                          offer.tireRequest.season === 'WINTER' ? 'Winterreifen' : 'Ganzjahresreifen'
                        } • ${offer.tireRequest.quantity} Stück`
                      })()}
                    </p>
                  </div>
                  <div className="text-right">
                    {offer.status === 'ACCEPTED' ? (
                      <p className="text-2xl font-bold text-primary-600">
                        {calculateTotalPrice(offer).toFixed(2)} €
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Preis wird nach Auswahl<br />der Reifen durch den<br />Kunden festgelegt
                      </p>
                    )}
                  </div>
                </div>

                {offer.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{offer.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kunde</h4>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {offer.tireRequest.customer.user.firstName} {offer.tireRequest.customer.user.lastName}
                    </p>
                    {/* Vollständige Kontaktdaten nur bei angenommenen Angeboten */}
                    {offer.status === 'ACCEPTED' && (
                      <>
                        {offer.tireRequest.customer.user.street && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {offer.tireRequest.customer.user.street}
                          </p>
                        )}
                        {(offer.tireRequest.customer.user.zipCode || offer.tireRequest.customer.user.city) && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {offer.tireRequest.customer.user.zipCode} {offer.tireRequest.customer.user.city}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{offer.tireRequest.customer.user.email}</p>
                        {offer.tireRequest.customer.user.phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{offer.tireRequest.customer.user.phone}</p>
                        )}
                      </>
                    )}
                    {offer.status !== 'ACCEPTED' && (offer.tireRequest.customer.user.zipCode || offer.tireRequest.customer.user.city) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {offer.tireRequest.customer.user.zipCode} {offer.tireRequest.customer.user.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reifen</h4>
                    {offer.tireOptions && offer.tireOptions.length > 0 ? (
                      <div>
                        {offer.status === 'ACCEPTED' ? (
                          // Bei angenommenen Angeboten: nur die vom Kunden ausgewählten
                          offer.selectedTireOptionIds && offer.selectedTireOptionIds.length > 0 ? (
                            offer.tireOptions
                              .filter(option => offer.selectedTireOptionIds.includes(option.id))
                              .map((option, index) => (
                                <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                  {option.brand} {option.model}
                                </p>
                              ))
                          ) : null
                        ) : (
                          // Bei offenen Angeboten: alle angebotenen Optionen
                          offer.tireOptions.map((option, index) => (
                            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              {option.carTireType === 'FRONT_TWO' ? 'Vorne: ' : option.carTireType === 'REAR_TWO' ? 'Hinten: ' : ''}{option.brand} {option.model}
                            </p>
                          ))
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-500 italic">Keine Reifenangabe</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Erstellt: {new Date(offer.createdAt).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gültig bis: {new Date(offer.validUntil).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Benötigt bis: {new Date(offer.tireRequest.needByDate).toLocaleDateString('de-DE')}
                    </p>
                    {offer.acceptedAt && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Angenommen: {new Date(offer.acceptedAt).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hinweis</h4>
                    {(() => {
                      const notes = offer.tireRequest.additionalNotes || ''
                      
                      // Filtere strukturierte Daten und Service-Marker aus
                      let cleanNotes = notes
                        .replace(/Vorder(?:achse|reifen):\s*\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                        .replace(/Hinter(?:achse|reifen):\s*\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                        .replace(/Altreifenentsorgung gewünscht\n?/g, '')
                        .replace(/Wuchten gewünscht\n?/g, '')
                        .replace(/Einlagerung gewünscht\n?/g, '')
                        .replace(/🏍️ MOTORRADREIFEN\n?/g, '')
                        .replace(/🔧 REIFENREPARATUR\n?/g, '')
                        .replace(/🔧 SONSTIGE REIFENSERVICES\n?/g, '')
                        .replace(/⚙️ ACHSVERMESSUNG\n?/g, '')
                        .replace(/📐 ACHSVERMESSUNG\n?/g, '')
                        .replace(/🛠️ SONSTIGE DIENSTLEISTUNG\n?/g, '')
                        .replace(/🔴 BREMSENWECHSEL\n?/g, '')
                        .replace(/BREMSEN-SERVICE\n?/g, '')
                        .replace(/🔋 BATTERIEWECHSEL\n?/g, '')
                        .replace(/BATTERIE-SERVICE\n?/g, '')
                        .replace(/❄️ KLIMASERVICE\n?/g, '')
                        .replace(/🌡️ KLIMASERVICE\n?/g, '')
                        .replace(/KLIMASERVICE:\s*/g, '')
                        .replace(/RÄDER UMSTECKEN\n?/g, '')
                        .replace(/Vorderachse:\s*[^\n]*\n?/g, '')
                        .replace(/Hinterachse:\s*[^\n]*\n?/g, '')
                        .replace(/Keine Arbeiten\n?/g, '')
                        .trim()
                      
                      return cleanNotes ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                          {cleanNotes}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-500 italic">Kein Hinweis</p>
                      )
                    })()}
                  </div>
                </div>

                {/* Booking Code for Accepted Offers */}
                {offer.status === 'ACCEPTED' && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Buchungs-Code für telefonische Terminvereinbarung:
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          Der Kunde verwendet diesen Code, wenn er telefonisch einen Termin vereinbaren möchte
                        </p>
                      </div>
                      <div className="text-center bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Code</p>
                        <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                          {offer.tireRequest.id.slice(-4).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {offer.status === 'DECLINED' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900">
                      ℹ️ Der Kunde hat sich für ein Angebot einer anderen Werkstatt entschieden.
                    </p>
                  </div>
                )}

                {offer.booking && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      ✓ Termin gebucht: {new Date(offer.booking.appointmentDate).toLocaleDateString('de-DE')} um {offer.booking.appointmentTime}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
