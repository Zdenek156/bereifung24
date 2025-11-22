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
  loadIndex: number | null
  speedRating: string | null
  isRunflat: boolean
  quantity: number
  preferredBrands: string | null
  specificBrand: string | null
  additionalNotes: string | null
  zipCode: string
  city: string | null
  radiusKm: number
  needByDate: string
  status: string
  createdAt: string
  distance: number
  vehicleInfo?: string
  customer: {
    user: {
      firstName: string
      lastName: string
      zipCode: string
      city: string | null
    }
  }
  offers: Array<{
    id: string
    status: string
    createdAt: string
  }>
  _count: {
    offers: number
  }
}

interface OfferFormData {
  tireBrand: string
  tireModel: string
  description: string
  pricePerTire: string
  installationFee: string
  validDays: number
  durationMinutes: string
}

interface WorkshopService {
  id: string
  serviceType: string
  basePrice: number
  basePrice4: number | null
  runFlatSurcharge: number | null
  disposalFee: number | null
  durationMinutes: number
  durationMinutes4: number | null
  isActive: boolean
}

export default function BrowseRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<TireRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'quoted'>('all')
  const [selectedRequest, setSelectedRequest] = useState<TireRequest | null>(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [services, setServices] = useState<WorkshopService[]>([])
  const [offerForm, setOfferForm] = useState<OfferFormData>({
    tireBrand: '',
    tireModel: '',
    description: '',
    pricePerTire: '',
    installationFee: '',
    validDays: 7,
    durationMinutes: ''
  })
  const [submitting, setSubmitting] = useState(false)

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
    fetchServices()
    fetchRequests()
  }, [session, status, router])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/workshop/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.filter((s: WorkshopService) => s.isActive))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/workshop/tire-requests')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setRequests(data.requests)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      'SUMMER': 'Sommer',
      'WINTER': 'Winter',
      'ALL_SEASON': 'Ganzjahres'
    }
    return labels[season] || season
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'new') return req.status === 'PENDING' && req.offers.length === 0
    if (filter === 'quoted') return req.offers.length > 0
    return true
  })

  const handleCreateOffer = (request: TireRequest) => {
    setSelectedRequest(request)
    setShowOfferForm(true)
    
    // Finde passenden Service basierend auf Anfragetyp
    const tireChangeService = services.find(s => s.serviceType === 'TIRE_CHANGE')
    
    let calculatedPrice = ''
    let calculatedInstallation = ''
    let calculatedDuration = ''
    
    if (tireChangeService) {
      // Wähle Preis basierend auf Anzahl (2 oder 4 Reifen)
      const pricePerTire = request.quantity === 4 && tireChangeService.basePrice4
        ? tireChangeService.basePrice4 / 4
        : tireChangeService.basePrice / 2
      
      calculatedPrice = pricePerTire.toFixed(2)
      
      // Berechne Montagegebühr (inkl. RunFlat und Entsorgung wenn nötig)
      let installation = 0
      if (request.isRunflat && tireChangeService.runFlatSurcharge) {
        installation += tireChangeService.runFlatSurcharge * request.quantity
      }
      if (tireChangeService.disposalFee) {
        installation += tireChangeService.disposalFee * request.quantity
      }
      calculatedInstallation = installation.toFixed(2)
      
      // Wähle Dauer basierend auf Anzahl
      calculatedDuration = (request.quantity === 4 && tireChangeService.durationMinutes4
        ? tireChangeService.durationMinutes4
        : tireChangeService.durationMinutes).toString()
    }
    
    setOfferForm({
      tireBrand: request.preferredBrands?.split(',')[0] || '',
      tireModel: '',
      description: '',
      pricePerTire: calculatedPrice,
      installationFee: calculatedInstallation,
      validDays: 7,
      durationMinutes: calculatedDuration
    })
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/workshop/tire-requests/${selectedRequest.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offerForm,
          pricePerTire: parseFloat(offerForm.pricePerTire),
          installationFee: parseFloat(offerForm.installationFee),
          durationMinutes: offerForm.durationMinutes ? parseInt(offerForm.durationMinutes) : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Erstellen')
      }

      alert('Angebot erfolgreich erstellt! Der Kunde wurde per E-Mail benachrichtigt.')
      setShowOfferForm(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Erstellen des Angebots')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = () => {
    if (!selectedRequest || !offerForm.pricePerTire || !offerForm.installationFee) return 0
    return (parseFloat(offerForm.pricePerTire) * selectedRequest.quantity) + parseFloat(offerForm.installationFee)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Anfragen durchsuchen</h1>
              <p className="mt-1 text-sm text-gray-600">
                Kundenanfragen finden und Angebote erstellen
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({requests.length})
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'new'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Neu ({requests.filter(r => r.status === 'PENDING' && r.offers.length === 0).length})
            </button>
            <button
              onClick={() => setFilter('quoted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'quoted'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mit Angeboten ({requests.filter(r => r.offers.length > 0).length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Anfragen gefunden</h3>
            <p className="text-gray-600">
              {filter === 'new' && 'Es gibt aktuell keine neuen Anfragen.'}
              {filter === 'quoted' && 'Sie haben noch keine Angebote erstellt.'}
              {filter === 'all' && 'Es gibt aktuell keine offenen Anfragen.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => {
              const hasOwnOffer = request.offers.length > 0
              const daysUntilNeeded = Math.ceil(
                (new Date(request.needByDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <div key={request.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {request.width}/{request.aspectRatio} R{request.diameter}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.season === 'SUMMER' ? 'bg-yellow-100 text-yellow-800' :
                            request.season === 'WINTER' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {getSeasonLabel(request.season)}
                          </span>
                          {request.isRunflat && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Runflat
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Menge:</span> {request.quantity} Reifen
                          </p>
                          {request.loadIndex && (
                            <p>
                              <span className="font-medium">Tragfähigkeit:</span> {request.loadIndex}
                              {request.speedRating && ` ${request.speedRating}`}
                            </p>
                          )}
                          {request.preferredBrands && (
                            <p>
                              <span className="font-medium">Bevorzugte Marken:</span> {request.preferredBrands}
                            </p>
                          )}
                          {request.specificBrand && (
                            <p>
                              <span className="font-medium">Spezifische Marke:</span> {request.specificBrand}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          daysUntilNeeded <= 3 ? 'bg-red-100 text-red-800' :
                          daysUntilNeeded <= 7 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Benötigt in {daysUntilNeeded} Tagen
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Kunde</h4>
                        <p className="text-sm text-gray-600">
                          {request.customer.user.firstName} {request.customer.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          PLZ: {request.zipCode}{request.city ? ` - ${request.city}` : ''}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Umkreis: {request.radiusKm} km
                        </p>
                        {request.vehicleInfo && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Fahrzeug:</span> {request.vehicleInfo}
                          </p>
                        )}
                      </div>

                      {request.additionalNotes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Zusätzliche Hinweise</h4>
                          <p className="text-sm text-gray-600">{request.additionalNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Erstellt: {new Date(request.createdAt).toLocaleDateString('de-DE')}</span>
                        {request._count.offers > 0 && (
                          <>
                            <span>•</span>
                            <span>{request._count.offers} {request._count.offers === 1 ? 'Angebot' : 'Angebote'}</span>
                          </>
                        )}
                      </div>

                      {hasOwnOffer ? (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium text-sm">
                          ✓ Angebot erstellt
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCreateOffer(request)}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                          Angebot erstellen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Offer Form Modal */}
      {showOfferForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Angebot erstellen</h2>
                <button
                  onClick={() => {
                    setShowOfferForm(false)
                    setSelectedRequest(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Für: {selectedRequest.width}/{selectedRequest.aspectRatio} R{selectedRequest.diameter} • 
                {' '}{getSeasonLabel(selectedRequest.season)} • 
                {' '}{selectedRequest.quantity} Reifen
              </div>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reifenmarke *
                    </label>
                    <input
                      type="text"
                      required
                      value={offerForm.tireBrand}
                      onChange={(e) => setOfferForm({ ...offerForm, tireBrand: e.target.value })}
                      placeholder="z.B. Continental"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reifenmodell *
                    </label>
                    <input
                      type="text"
                      required
                      value={offerForm.tireModel}
                      onChange={(e) => setOfferForm({ ...offerForm, tireModel: e.target.value })}
                      placeholder="z.B. PremiumContact 6"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung (optional)
                  </label>
                  <textarea
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    rows={3}
                    placeholder="Zusätzliche Informationen zum Reifen..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preis pro Reifen (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={offerForm.pricePerTire}
                      onChange={(e) => setOfferForm({ ...offerForm, pricePerTire: e.target.value })}
                      placeholder="99.99"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montagegebühr gesamt (€) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={offerForm.installationFee}
                      onChange={(e) => setOfferForm({ ...offerForm, installationFee: e.target.value })}
                      placeholder="50.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dauer (Minuten)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={offerForm.durationMinutes}
                      onChange={(e) => setOfferForm({ ...offerForm, durationMinutes: e.target.value })}
                      placeholder="60"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Angebot gültig für (Tage)
                  </label>
                  <select
                    value={offerForm.validDays}
                    onChange={(e) => setOfferForm({ ...offerForm, validDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={3}>3 Tage</option>
                    <option value={7}>7 Tage</option>
                    <option value={14}>14 Tage</option>
                    <option value={30}>30 Tage</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedRequest.quantity}x Reifen à {offerForm.pricePerTire || '0.00'} €
                    </span>
                    <span className="text-sm text-gray-900">
                      {offerForm.pricePerTire ? (parseFloat(offerForm.pricePerTire) * selectedRequest.quantity).toFixed(2) : '0.00'} €
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Montage</span>
                    <span className="text-sm text-gray-900">
                      {offerForm.installationFee || '0.00'} €
                    </span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Gesamtpreis</span>
                      <span className="text-lg font-bold text-primary-600">
                        {calculateTotal().toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferForm(false)
                    setSelectedRequest(null)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Wird erstellt...' : 'Angebot senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
