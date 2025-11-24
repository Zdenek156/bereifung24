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

interface TireOption {
  brand: string
  model: string
  costPrice: string
  pricePerTire: string
}

interface OfferFormData {
  tireOptions: TireOption[]
  description: string
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
    tireOptions: [{ brand: '', model: '', costPrice: '', pricePerTire: '' }],
    description: '',
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
        setServices(data.services.filter((s: WorkshopService) => s.isActive))
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
    
    // Prüfe ob es eine Räder-Wechsel-Anfrage ist (width=0)
    const isWheelChange = request.width === 0 && request.aspectRatio === 0 && request.diameter === 0
    
    // Finde passenden Service basierend auf Anfragetyp
    const service = isWheelChange 
      ? services.find(s => s.serviceType === 'WHEEL_CHANGE')
      : services.find(s => s.serviceType === 'TIRE_CHANGE')
    
    let calculatedInstallation = ''
    let calculatedDuration = ''
    
    if (service) {
      if (isWheelChange) {
        // Räder-Wechsel: Einfacher Grundpreis
        calculatedInstallation = service.basePrice.toFixed(2)
        calculatedDuration = service.durationMinutes.toString()
      } else {
        // Reifen-Wechsel: Preis basierend auf Anzahl
        let installation = request.quantity === 4 && service.basePrice4
          ? service.basePrice4
          : service.basePrice
        
        // Addiere RunFlat und Entsorgung wenn nötig
        if (request.isRunflat && service.runFlatSurcharge) {
          installation += service.runFlatSurcharge * request.quantity
        }
        if (service.disposalFee) {
          installation += service.disposalFee * request.quantity
        }
        calculatedInstallation = installation.toFixed(2)
        
        // Wähle Dauer basierend auf Anzahl
        calculatedDuration = (request.quantity === 4 && service.durationMinutes4
          ? service.durationMinutes4
          : service.durationMinutes).toString()
      }
    }
    
    // Initialisiere mit einem leeren Reifenangebot
    const preferredBrand = request.preferredBrands?.split(',')[0] || ''
    setOfferForm({
      tireOptions: [{ brand: preferredBrand, model: '', costPrice: '', pricePerTire: '' }],
      description: '',
      installationFee: calculatedInstallation,
      validDays: 7,
      durationMinutes: calculatedDuration
    })
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    const isWheelChange = selectedRequest.width === 0 && selectedRequest.aspectRatio === 0 && selectedRequest.diameter === 0

    // Validierung: Bei normalen Reifenanfragen muss mindestens ein Reifenangebot vollständig ausgefüllt sein
    if (!isWheelChange) {
      const validOptions = offerForm.tireOptions.filter(opt => 
        opt.brand.trim() && opt.model.trim() && opt.pricePerTire.trim()
      )
      
      if (validOptions.length === 0) {
        alert('Bitte geben Sie mindestens ein Reifenangebot an.')
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/workshop/tire-requests/${selectedRequest.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tireOptions: validOptions.map(opt => ({
            brand: opt.brand,
            model: opt.model,
            pricePerTire: parseFloat(opt.pricePerTire)
          })),
          description: offerForm.description,
          installationFee: parseFloat(offerForm.installationFee),
          validDays: offerForm.validDays,
          durationMinutes: offerForm.durationMinutes ? parseInt(offerForm.durationMinutes) : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Server error response:', error)
        throw new Error(error.message || error.error || 'Fehler beim Erstellen')
      }

      alert('Angebot erfolgreich erstellt! Der Kunde wurde per E-Mail benachrichtigt.')
      setShowOfferForm(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (error: any) {
      console.error('Offer creation failed:', error)
      alert(`Fehler: ${error.message || 'Fehler beim Erstellen des Angebots'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const addTireOption = () => {
    setOfferForm({
      ...offerForm,
      tireOptions: [...offerForm.tireOptions, { brand: '', model: '', costPrice: '', pricePerTire: '' }]
    })
  }

  const removeTireOption = (index: number) => {
    if (offerForm.tireOptions.length <= 1) return
    setOfferForm({
      ...offerForm,
      tireOptions: offerForm.tireOptions.filter((_, i) => i !== index)
    })
  }

  const updateTireOption = (index: number, field: keyof TireOption, value: string) => {
    const updated = [...offerForm.tireOptions]
    updated[index] = { ...updated[index], [field]: value }
    setOfferForm({
      ...offerForm,
      tireOptions: updated
    })
  }

  const calculateSellingPrice = async (index: number, costPrice: string) => {
    if (!costPrice || parseFloat(costPrice) <= 0) {
      return
    }

    try {
      const response = await fetch('/api/workshop/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPrice: parseFloat(costPrice),
          category: 'auto' // Assuming tire requests are for auto tires
        })
      })

      if (response.ok) {
        const data = await response.json()
        const updated = [...offerForm.tireOptions]
        updated[index] = { 
          ...updated[index], 
          costPrice: costPrice,
          pricePerTire: data.sellingPrice.toFixed(2)
        }
        setOfferForm({
          ...offerForm,
          tireOptions: updated
        })
      }
    } catch (error) {
      console.error('Error calculating price:', error)
    }
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
                          {request.width === 0 && request.aspectRatio === 0 && request.diameter === 0 ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🔧 Räder umstecken
                            </h3>
                          ) : (
                            <>
                              <h3 className="text-xl font-bold text-primary-600">
                                🔧 {request.width}/{request.aspectRatio} R{request.diameter}
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
                            </>
                          )}
                        </div>
                        {request.width !== 0 && (
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
                        )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Kunde</h4>
                        <p className="text-sm text-gray-600">
                          {request.customer.user.firstName} {request.customer.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          PLZ: {request.zipCode}{request.city ? ` - ${request.city}` : ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          Umkreis: {request.radiusKm} km
                        </p>
                        {request.vehicleInfo && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Fahrzeug:</span> {request.vehicleInfo}
                          </p>
                        )}
                      </div>

                      {request.additionalNotes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            {request.width === 0 ? 'Service-Details' : 'Zusätzliche Hinweise'}
                          </h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{request.additionalNotes}</p>
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
                {selectedRequest.width === 0 ? (
                  <>Für: 🔧 Räder umstecken (Sommer/Winter)</>
                ) : (
                  <>
                    Für: {selectedRequest.width}/{selectedRequest.aspectRatio} R{selectedRequest.diameter} • 
                    {' '}{getSeasonLabel(selectedRequest.season)} • 
                    {' '}{selectedRequest.quantity} Reifen
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6">
              <div className="space-y-6">
                {selectedRequest.width !== 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Reifenangebote *
                      </label>
                      <button
                        type="button"
                        onClick={addTireOption}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Weiteres Angebot hinzufügen
                      </button>
                    </div>
                  
                  <div className="space-y-4">
                    {offerForm.tireOptions.map((option, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-900">
                            Angebot {index + 1}
                          </span>
                          {offerForm.tireOptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTireOption(index)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Entfernen
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Marke *
                            </label>
                            <input
                              type="text"
                              value={option.brand}
                              onChange={(e) => updateTireOption(index, 'brand', e.target.value)}
                              placeholder="z.B. Continental"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Modell *
                            </label>
                            <input
                              type="text"
                              value={option.model}
                              onChange={(e) => updateTireOption(index, 'model', e.target.value)}
                              placeholder="z.B. PremiumContact 6"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Einkaufspreis (€) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.costPrice}
                              onChange={(e) => {
                                updateTireOption(index, 'costPrice', e.target.value)
                                if (e.target.value && parseFloat(e.target.value) > 0) {
                                  calculateSellingPrice(index, e.target.value)
                                }
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Verkaufspreis (€) *
                              {option.costPrice && option.pricePerTire && parseFloat(option.costPrice) > 0 && (
                                <span className="ml-1 text-green-600 text-xs">
                                  (berechnet)
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.pricePerTire}
                              onChange={(e) => updateTireOption(index, 'pricePerTire', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-green-50"
                            />
                            {option.costPrice && option.pricePerTire && parseFloat(option.costPrice) > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                Aufschlag: {(parseFloat(option.pricePerTire) - parseFloat(option.costPrice)).toFixed(2)} €
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zusätzliche Beschreibung (optional)
                  </label>
                  <textarea
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    rows={3}
                    placeholder="Weitere Informationen zum Angebot..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Service-Informationen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Montagegebühr gesamt</div>
                      <div className="text-lg font-bold text-gray-900">
                        {offerForm.installationFee ? `${parseFloat(offerForm.installationFee).toFixed(2)} €` : 'Nicht konfiguriert'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Dauer</div>
                      <div className="text-lg font-bold text-gray-900">
                        {offerForm.durationMinutes ? `${offerForm.durationMinutes} Minuten` : 'Nicht konfiguriert'}
                      </div>
                    </div>
                  </div>
                  {!offerForm.installationFee && (
                    <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠️ Bitte konfigurieren Sie zuerst Ihre Services in der Service-Verwaltung
                    </div>
                  )}
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
