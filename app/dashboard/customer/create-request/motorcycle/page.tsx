'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Motorrad-spezifische Dimensionen
const MOTO_WIDTHS = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 240, 260, 280, 300]
const MOTO_ASPECT_RATIOS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]
const MOTO_DIAMETERS = [10, 12, 14, 16, 17, 18, 19, 21]

// Load Index für Motorräder
const LOAD_INDEX_MAP: Record<number, number> = {
  50: 190, 55: 218, 60: 250, 65: 290, 70: 335, 75: 387, 80: 450, 82: 475, 84: 500, 85: 515, 
  86: 530, 87: 545, 88: 560, 89: 580, 90: 600, 91: 615, 92: 630, 93: 650, 94: 670, 95: 690
}
const LOAD_INDICES = Object.keys(LOAD_INDEX_MAP).map(Number)

// Speed Rating für Motorräder
const SPEED_RATING_MAP: Record<string, number> = {
  L: 120, M: 130, N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, H: 210, V: 240, W: 270, ZR: 240
}
const SPEED_RATINGS = Object.keys(SPEED_RATING_MAP)

type TireData = {
  width: number
  aspectRatio: number
  diameter: number
  loadIndex?: number
  speedRating?: string
  hasDifferentSizes?: boolean
  rearWidth?: number
  rearAspectRatio?: number
  rearDiameter?: number
  rearLoadIndex?: number
  rearSpeedRating?: string
}

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  vehicleType?: string
  summerTires?: TireData
  winterTires?: TireData
  allSeasonTires?: TireData
}

export default function MotorcycleTiresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [vehiclesLoading, setVehiclesLoading] = useState(true)

  const [formData, setFormData] = useState({
    // Vorderreifen
    frontWidth: '',
    frontAspectRatio: '',
    frontDiameter: '',
    frontLoadIndex: '',
    frontSpeedRating: '',
    
    // Hinterreifen
    rearWidth: '',
    rearAspectRatio: '',
    rearDiameter: '',
    rearLoadIndex: '',
    rearSpeedRating: '',
    
    season: 'SUMMER' as 'SUMMER' | 'WINTER' | 'ALL_SEASON',
    tireType: 'STANDARD' as 'STANDARD' | 'SPORT' | 'TOURING' | 'OFF_ROAD',
    quantity: 'BOTH' as 'FRONT' | 'REAR' | 'BOTH',
    tireQuality: 'QUALITY' as 'QUALITY' | 'BUDGET',
    tireDisposal: true,
    preferredBrands: '',
    additionalNotes: '',
    needByDate: '',
    radiusKm: 25,
    motorcycleMake: '',
    motorcycleModel: ''
  })

  // Load motorcycles
  useEffect(() => {
    if (status === 'authenticated') {
      setVehiclesLoading(true)
      fetch('/api/vehicles')
        .then(res => res.json())
        .then(data => {
          // Filter only motorcycles
          const motorcycles = data.filter((v: Vehicle) => v.vehicleType === 'MOTORCYCLE')
          console.log('Loaded motorcycles:', motorcycles)
          setVehicles(motorcycles)
        })
        .catch(err => console.error('Fehler beim Laden der Motorräder:', err))
        .finally(() => setVehiclesLoading(false))
    }
  }, [status])

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    if (!vehicleId) {
      // Reset form when deselecting
      setFormData(prev => ({
        ...prev,
        motorcycleMake: '',
        motorcycleModel: '',
        frontWidth: '',
        frontAspectRatio: '',
        frontDiameter: '',
        frontLoadIndex: '',
        frontSpeedRating: '',
        rearWidth: '',
        rearAspectRatio: '',
        rearDiameter: '',
        rearLoadIndex: '',
        rearSpeedRating: '',
      }))
      return
    }

    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle) return

    console.log('Selected vehicle:', vehicle)

    // Determine which tire data to use based on available data
    // Priority: summer -> winter -> all-season
    let tireData = vehicle.summerTires || vehicle.winterTires || vehicle.allSeasonTires
    let detectedSeason: 'SUMMER' | 'WINTER' | 'ALL_SEASON' = 'SUMMER'
    
    if (vehicle.summerTires) {
      tireData = vehicle.summerTires
      detectedSeason = 'SUMMER'
    } else if (vehicle.winterTires) {
      tireData = vehicle.winterTires
      detectedSeason = 'WINTER'
    } else if (vehicle.allSeasonTires) {
      tireData = vehicle.allSeasonTires
      detectedSeason = 'ALL_SEASON'
    }

    console.log('Tire data:', tireData, 'Detected season:', detectedSeason)

    // Pre-fill tire dimensions if available
    if (tireData) {
      const hasDifferentSizes = tireData.hasDifferentSizes
      const rearWidth = hasDifferentSizes && tireData.rearWidth 
        ? tireData.rearWidth.toString() 
        : tireData.width.toString()
      const rearAspectRatio = hasDifferentSizes && tireData.rearAspectRatio 
        ? tireData.rearAspectRatio.toString() 
        : tireData.aspectRatio.toString()
      const rearDiameter = hasDifferentSizes && tireData.rearDiameter 
        ? tireData.rearDiameter.toString() 
        : tireData.diameter.toString()
      const rearLoadIndex = hasDifferentSizes && tireData.rearLoadIndex 
        ? tireData.rearLoadIndex.toString() 
        : (tireData.loadIndex?.toString() || '')
      const rearSpeedRating = hasDifferentSizes && tireData.rearSpeedRating 
        ? tireData.rearSpeedRating 
        : (tireData.speedRating || '')

      // Set all data in one call to prevent race conditions
      console.log('Loading tire data:', {
        width: tireData.width,
        aspectRatio: tireData.aspectRatio,
        diameter: tireData.diameter,
        loadIndex: tireData.loadIndex,
        speedRating: tireData.speedRating,
        hasDifferentSizes: tireData.hasDifferentSizes,
        rearWidth: tireData.rearWidth,
        rearAspectRatio: tireData.rearAspectRatio,
        rearDiameter: tireData.rearDiameter
      })
      
      setFormData(prev => {
        const newData = {
          ...prev,
          motorcycleMake: vehicle.make,
          motorcycleModel: vehicle.model,
          season: detectedSeason,
          frontWidth: tireData.width.toString(),
          frontAspectRatio: tireData.aspectRatio.toString(),
          frontDiameter: tireData.diameter.toString(),
          frontLoadIndex: tireData.loadIndex?.toString() || '',
          frontSpeedRating: tireData.speedRating || '',
          // Use rear-specific dimensions if available, otherwise use front dimensions
          rearWidth,
          rearAspectRatio,
          rearDiameter,
          rearLoadIndex,
          rearSpeedRating,
        }
        console.log('Setting form data:', newData)
        return newData
      })
    } else {
      // Only set make and model if no tire data
      setFormData(prev => ({
        ...prev,
        motorcycleMake: vehicle.make,
        motorcycleModel: vehicle.model,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.motorcycleMake || !formData.motorcycleModel) {
      setError('Bitte geben Sie Marke und Modell des Motorrads an')
      return
    }

    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }
    
    // Validierung je nach quantity
    if (formData.quantity === 'BOTH' || formData.quantity === 'FRONT') {
      if (!formData.frontWidth || !formData.frontAspectRatio || !formData.frontDiameter) {
        setError('Bitte geben Sie die Vorderreifen-Dimensionen an')
        return
      }
    }
    
    if (formData.quantity === 'BOTH' || formData.quantity === 'REAR') {
      if (!formData.rearWidth || !formData.rearAspectRatio || !formData.rearDiameter) {
        setError('Bitte geben Sie die Hinterreifen-Dimensionen an')
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const requestData = {
        motorcycleMake: formData.motorcycleMake,
        motorcycleModel: formData.motorcycleModel,
        season: formData.season,
        tireType: formData.tireType,
        needsFrontTire: formData.quantity === 'FRONT' || formData.quantity === 'BOTH',
        needsRearTire: formData.quantity === 'REAR' || formData.quantity === 'BOTH',
        frontTire: (formData.quantity === 'FRONT' || formData.quantity === 'BOTH') ? {
          width: parseInt(formData.frontWidth),
          aspectRatio: parseInt(formData.frontAspectRatio),
          diameter: parseInt(formData.frontDiameter),
          loadIndex: formData.frontLoadIndex ? parseInt(formData.frontLoadIndex) : undefined,
          speedRating: formData.frontSpeedRating || undefined
        } : undefined,
        rearTire: (formData.quantity === 'REAR' || formData.quantity === 'BOTH') ? {
          width: parseInt(formData.rearWidth),
          aspectRatio: parseInt(formData.rearAspectRatio),
          diameter: parseInt(formData.rearDiameter),
          loadIndex: formData.rearLoadIndex ? parseInt(formData.rearLoadIndex) : undefined,
          speedRating: formData.rearSpeedRating || undefined
        } : undefined,
        needByDate: formData.needByDate,
        radiusKm: formData.radiusKm,
        tireQuality: formData.tireQuality,
        tireDisposal: formData.tireDisposal,
        preferredBrands: formData.preferredBrands || undefined,
        additionalNotes: formData.additionalNotes || undefined
      }

      const res = await fetch('/api/tire-requests/motorcycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (res.ok) {
        router.push('/dashboard/customer?success=motorcycle')
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Erstellen der Anfrage')
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/dashboard/customer/select-service"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Service-Auswahl
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Motorradreifen Anfrage mit Montage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Neue Motorradreifen kaufen und montieren lassen - Geben Sie Ihre Reifenspezifikationen an
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Reifendimensionen finden</p>
                <p>Die Reifengröße finden Sie auf der Seitenwand Ihrer aktuellen Reifen. Format: <span className="font-mono">120/70 ZR17 (58W)</span></p>
                <p className="mt-2">Vorder- und Hinterreifen haben bei Motorrädern oft unterschiedliche Größen!</p>
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Motorrad auswählen</h2>
            {vehiclesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">Lade Motorräder...</p>
              </div>
            ) : vehicles.length > 0 ? (
              <div>
                <select
                  value={selectedVehicle}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Motorrad auswählen oder manuell eingeben</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-600">
                  💡 Wählen Sie ein gespeichertes Motorrad aus oder geben Sie die Daten manuell ein
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Sie haben noch keine Motorräder in Ihrer Fahrzeugverwaltung gespeichert. 
                  Sie können die Daten trotzdem manuell eingeben.
                </p>
              </div>
            )}
          </div>

          {/* Motorrad-Info (Optional) */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Motorrad-Informationen {!selectedVehicle && <span className="text-sm font-normal text-gray-500">(optional)</span>}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hersteller
                </label>
                <input
                  type="text"
                  value={formData.motorcycleMake}
                  onChange={(e) => setFormData({ ...formData, motorcycleMake: e.target.value })}
                  placeholder="z.B. Honda, Yamaha, BMW"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modell
                </label>
                <input
                  type="text"
                  value={formData.motorcycleModel}
                  onChange={(e) => setFormData({ ...formData, motorcycleModel: e.target.value })}
                  placeholder="z.B. CBR 600, MT-07, R1250GS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Welche Reifen benötigt */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Welche Reifen benötigen Sie?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.quantity === 'BOTH' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="quantity"
                  value="BOTH"
                  checked={formData.quantity === 'BOTH'}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Beide Reifen</p>
                <p className="text-sm text-gray-600 text-center">Vorder- & Hinterreifen</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.quantity === 'FRONT' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="quantity"
                  value="FRONT"
                  checked={formData.quantity === 'FRONT'}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Nur Vorderreifen</p>
                <p className="text-sm text-gray-600 text-center">1 Reifen vorne</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.quantity === 'REAR' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="quantity"
                  value="REAR"
                  checked={formData.quantity === 'REAR'}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Nur Hinterreifen</p>
                <p className="text-sm text-gray-600 text-center">1 Reifen hinten</p>
              </label>
            </div>
          </div>

          {/* Vorderreifen Dimensionen */}
          {(formData.quantity === 'BOTH' || formData.quantity === 'FRONT') && (
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏍️ Vorderreifen Dimensionen</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breite *
                  </label>
                  <select
                    value={formData.frontWidth}
                    onChange={(e) => setFormData({ ...formData, frontWidth: e.target.value })}
                    required={formData.quantity === 'BOTH' || formData.quantity === 'FRONT'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wählen</option>
                    {MOTO_WIDTHS.map(width => (
                      <option key={width} value={width}>{width}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Höhe *
                  </label>
                  <select
                    value={formData.frontAspectRatio}
                    onChange={(e) => setFormData({ ...formData, frontAspectRatio: e.target.value })}
                    required={formData.quantity === 'BOTH' || formData.quantity === 'FRONT'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wählen</option>
                    {MOTO_ASPECT_RATIOS.map(ratio => (
                      <option key={ratio} value={ratio}>{ratio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoll *
                  </label>
                  <select
                    value={formData.frontDiameter}
                    onChange={(e) => setFormData({ ...formData, frontDiameter: e.target.value })}
                    required={formData.quantity === 'BOTH' || formData.quantity === 'FRONT'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wählen</option>
                    {MOTO_DIAMETERS.map(diameter => (
                      <option key={diameter} value={diameter}>{diameter}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Load Index
                  </label>
                  <select
                    value={formData.frontLoadIndex}
                    onChange={(e) => setFormData({ ...formData, frontLoadIndex: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Optional</option>
                    {LOAD_INDICES.map(index => (
                      <option key={index} value={index}>{index}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed Rating
                  </label>
                  <select
                    value={formData.frontSpeedRating}
                    onChange={(e) => setFormData({ ...formData, frontSpeedRating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Optional</option>
                    {SPEED_RATINGS.map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Hinterreifen Dimensionen */}
          {(formData.quantity === 'BOTH' || formData.quantity === 'REAR') && (
            <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏍️ Hinterreifen Dimensionen</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breite *
                  </label>
                  <select
                    value={formData.rearWidth}
                    onChange={(e) => setFormData({ ...formData, rearWidth: e.target.value })}
                    required={formData.quantity === 'BOTH' || formData.quantity === 'REAR'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wählen</option>
                    {MOTO_WIDTHS.map(width => (
                      <option key={width} value={width}>{width}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Höhe *
                  </label>
                  <select
                    value={formData.rearAspectRatio}
                    onChange={(e) => setFormData({ ...formData, rearAspectRatio: e.target.value })}
                    required={formData.quantity === 'BOTH' || formData.quantity === 'REAR'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wählen</option>
                    {MOTO_ASPECT_RATIOS.map(ratio => (
                      <option key={ratio} value={ratio}>{ratio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoll *
                  </label>
                  <select
                    value={formData.rearDiameter}
                    onChange={(e) => setFormData({ ...formData, rearDiameter: e.target.value })}
                    required={formData.quantity === 'BOTH' || formData.quantity === 'REAR'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Wählen</option>
                    {MOTO_DIAMETERS.map(diameter => (
                      <option key={diameter} value={diameter}>{diameter}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Load Index
                  </label>
                  <select
                    value={formData.rearLoadIndex}
                    onChange={(e) => setFormData({ ...formData, rearLoadIndex: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Optional</option>
                    {LOAD_INDICES.map(index => (
                      <option key={index} value={index}>{index}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speed Rating
                  </label>
                  <select
                    value={formData.rearSpeedRating}
                    onChange={(e) => setFormData({ ...formData, rearSpeedRating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Optional</option>
                    {SPEED_RATINGS.map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Saison */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Saison</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.season === 'SUMMER' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="season"
                  value="SUMMER"
                  checked={formData.season === 'SUMMER'}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">☀️ Sommerreifen</p>
                <p className="text-xs text-gray-600 text-center">Für warme Monate</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.season === 'WINTER' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="season"
                  value="WINTER"
                  checked={formData.season === 'WINTER'}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">❄️ Winterreifen</p>
                <p className="text-xs text-gray-600 text-center">Für kalte Monate</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.season === 'ALL_SEASON' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="season"
                  value="ALL_SEASON"
                  checked={formData.season === 'ALL_SEASON'}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">🌤️ Ganzjahresreifen</p>
                <p className="text-xs text-gray-600 text-center">Ganzjährig</p>
              </label>
            </div>
          </div>

          {/* Reifentyp */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reifentyp</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tireType === 'STANDARD' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tireType"
                  value="STANDARD"
                  checked={formData.tireType === 'STANDARD'}
                  onChange={(e) => setFormData({ ...formData, tireType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">🏍️ Standard</p>
                <p className="text-xs text-gray-600 text-center">Allround</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tireType === 'SPORT' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tireType"
                  value="SPORT"
                  checked={formData.tireType === 'SPORT'}
                  onChange={(e) => setFormData({ ...formData, tireType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">🏁 Sport</p>
                <p className="text-xs text-gray-600 text-center">Straße</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tireType === 'TOURING' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tireType"
                  value="TOURING"
                  checked={formData.tireType === 'TOURING'}
                  onChange={(e) => setFormData({ ...formData, tireType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">🛣️ Touring</p>
                <p className="text-xs text-gray-600 text-center">Langstrecke</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tireType === 'OFF_ROAD' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tireType"
                  value="OFF_ROAD"
                  checked={formData.tireType === 'OFF_ROAD'}
                  onChange={(e) => setFormData({ ...formData, tireType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">🏔️ Off-Road</p>
                <p className="text-xs text-gray-600 text-center">Gelände</p>
              </label>
            </div>
          </div>

          {/* Reifenqualität */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reifenqualität</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tireQuality === 'QUALITY' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tireQuality"
                  value="QUALITY"
                  checked={formData.tireQuality === 'QUALITY'}
                  onChange={(e) => setFormData({ ...formData, tireQuality: e.target.value as any })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">⭐ Qualitätsreifen (empfohlen)</p>
                  <p className="text-sm text-gray-600">Markenreifen mit besserer Leistung und Sicherheit</p>
                </div>
              </label>

              <label className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.tireQuality === 'BUDGET' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="tireQuality"
                  value="BUDGET"
                  checked={formData.tireQuality === 'BUDGET'}
                  onChange={(e) => setFormData({ ...formData, tireQuality: e.target.value as any })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">💰 Budget-Reifen</p>
                  <p className="text-sm text-gray-600">Günstigere Alternative mit Basisqualität</p>
                </div>
              </label>
            </div>
          </div>

          {/* Zusätzliche Optionen */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Zusätzliche Optionen</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tireDisposal}
                  onChange={(e) => setFormData({ ...formData, tireDisposal: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
                  <span className="block font-medium text-gray-900">Entsorgung der Altreifen</span>
                  <span className="block text-sm text-gray-600">Umweltgerechte Entsorgung Ihrer alten Motorradreifen</span>
                </div>
              </label>
            </div>
          </div>

          {/* Bevorzugte Marken */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bevorzugte Reifenmarken (optional)
            </label>
            <input
              type="text"
              value={formData.preferredBrands}
              onChange={(e) => setFormData({ ...formData, preferredBrands: e.target.value })}
              placeholder="z.B. Michelin, Pirelli, Bridgestone, Metzeler, Dunlop"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Benötigt bis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benötigt bis *
            </label>
            <input
              type="date"
              value={formData.needByDate}
              onChange={(e) => setFormData({ ...formData, needByDate: e.target.value })}
              min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              required
              placeholder="Hier Datum auswählen"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Frühestens in 7 Tagen</p>
          </div>

          {/* Suchradius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suchradius: {formData.radiusKm} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={formData.radiusKm}
              onChange={(e) => setFormData({ ...formData, radiusKm: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Zusätzliche Anmerkungen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Anmerkungen (optional)
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={4}
              placeholder="Weitere Wünsche oder Informationen..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              href="/dashboard/customer/select-service"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wird erstellt...' : 'Anfrage erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
