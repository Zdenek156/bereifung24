'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TIRE_WIDTHS = [135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335, 345, 355, 365, 375, 385, 395]
const ASPECT_RATIOS = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
const DIAMETERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

// Load Index mit Tragfähigkeit in kg
const LOAD_INDEX_MAP: Record<number, number> = {
  50: 190, 55: 218, 60: 250, 65: 290, 70: 335, 75: 387, 80: 450, 82: 475, 84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580, 90: 600,
  91: 615, 92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850, 103: 875, 104: 900, 105: 925,
  106: 950, 107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215, 116: 1250, 117: 1285, 118: 1320, 119: 1360, 120: 1400
}
const LOAD_INDICES = Object.keys(LOAD_INDEX_MAP).map(Number)

// Speed Rating mit Geschwindigkeit in km/h
const SPEED_RATING_MAP: Record<string, number> = {
  L: 120, M: 130, N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, U: 200, H: 210, V: 240, W: 270, Y: 300, ZR: 240
}
const SPEED_RATINGS = Object.keys(SPEED_RATING_MAP)

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  vehicleType?: string
  summerTires?: { 
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
  winterTires?: { 
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
  allSeasonTires?: { 
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
}

export default function CreateRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [useManualEntry, setUseManualEntry] = useState(false)
  const [mixedTires, setMixedTires] = useState(false)
  const [userZipCode, setUserZipCode] = useState('')
  
  const [formData, setFormData] = useState({
    season: 'SUMMER',
    width: '',
    aspectRatio: '',
    diameter: '',
    loadIndex: '',
    speedRating: '',
    rearWidth: '',
    rearAspectRatio: '',
    rearDiameter: '',
    rearLoadIndex: '',
    rearSpeedRating: '',
    isRunflat: false,
    quantity: 2,
    tireQuality: 'QUALITY',
    tireDisposal: false,
    tirePosition: 'BOTH', // FRONT, REAR, BOTH
    preferredBrands: '',
    additionalNotes: '',
    needByDate: '',
    radiusKm: 25,
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Update quantity when mixedTires or tirePosition changes
  useEffect(() => {
    if (mixedTires || formData.tirePosition !== 'BOTH') {
      // Bei Mischbereifung oder wenn nur vorne/hinten: Prüfe Position
      if (formData.tirePosition === 'FRONT' || formData.tirePosition === 'REAR') {
        // Nur vorne ODER nur hinten = 2 Reifen
        setFormData(prev => ({ ...prev, quantity: 2 }))
      } else if (formData.tirePosition === 'BOTH') {
        // Vorne UND hinten = 4 Reifen
        setFormData(prev => ({ ...prev, quantity: 4 }))
      }
    }
  }, [mixedTires, formData.tirePosition])

  // Load vehicles and user profile
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/vehicles')
        .then(res => res.json())
        .then(data => {
          // Filter only cars for tire requests
          const cars = data.filter((v: Vehicle) => v.vehicleType === 'CAR' || !v.vehicleType)
          setVehicles(cars)
        })
        .catch(err => console.error('Fehler beim Laden der Fahrzeuge:', err))
      
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setUserZipCode(data.zipCode || ''))
        .catch(err => console.error('Fehler beim Laden des Profils:', err))
    }
  }, [status])

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    if (!vehicleId) {
      setUseManualEntry(false)
      return
    }

    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (!vehicle) return

    let tireSpec = null
    if (formData.season === 'SUMMER' && vehicle.summerTires) {
      tireSpec = vehicle.summerTires
    } else if (formData.season === 'WINTER' && vehicle.winterTires) {
      tireSpec = vehicle.winterTires
    } else if (formData.season === 'ALL_SEASON' && vehicle.allSeasonTires) {
      tireSpec = vehicle.allSeasonTires
    }

    if (tireSpec) {
      // Wenn Mischbereifung vorhanden ist, aktiviere sie und zeige beide Dimensionen
      if (tireSpec.hasDifferentSizes && tireSpec.rearWidth) {
        setMixedTires(true)
        setFormData(prev => ({
          ...prev,
          width: tireSpec.width.toString(),
          aspectRatio: tireSpec.aspectRatio.toString(),
          diameter: tireSpec.diameter.toString(),
          loadIndex: tireSpec.loadIndex?.toString() || '',
          speedRating: tireSpec.speedRating || '',
          rearWidth: tireSpec.rearWidth!.toString(),
          rearAspectRatio: tireSpec.rearAspectRatio!.toString(),
          rearDiameter: tireSpec.rearDiameter!.toString(),
          rearLoadIndex: tireSpec.rearLoadIndex?.toString() || '',
          rearSpeedRating: tireSpec.rearSpeedRating || '',
          tirePosition: 'BOTH',
        }))
      } else {
        // Normale Bereifung - nur vordere Dimensionen
        setMixedTires(false)
        setFormData(prev => ({
          ...prev,
          width: tireSpec.width.toString(),
          aspectRatio: tireSpec.aspectRatio.toString(),
          diameter: tireSpec.diameter.toString(),
          loadIndex: tireSpec.loadIndex?.toString() || '',
          speedRating: tireSpec.speedRating || '',
          rearWidth: '',
          rearAspectRatio: '',
          rearDiameter: '',
          rearLoadIndex: '',
          rearSpeedRating: '',
          tirePosition: 'BOTH',
        }))
      }
      setUseManualEntry(false)
    } else {
      setUseManualEntry(true)
    }
  }

  // Update tire specs when season changes
  useEffect(() => {
    if (selectedVehicle) {
      handleVehicleSelect(selectedVehicle)
    }
  }, [formData.season])

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'CUSTOMER') {
    router.push('/login')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      })
    } else if (name === 'quantity') {
      setFormData({
        ...formData,
        [name]: parseInt(value)
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.width || !formData.aspectRatio || !formData.diameter) {
      setError('Bitte alle Reifendimensionen angeben')
      return
    }
    
    // Validierung Hinterreifen bei Mischbereifung
    if (mixedTires) {
      if (!formData.rearWidth || !formData.rearAspectRatio || !formData.rearDiameter) {
        setError('Bitte alle Hinterreifen-Dimensionen angeben')
        return
      }
      if (!formData.rearLoadIndex || !formData.rearSpeedRating) {
        setError('Bitte Tragfähigkeit und Geschwindigkeitsindex für Hinterreifen angeben')
        return
      }
    }

    if (!userZipCode) {
      setError('Bitte PLZ in Ihren Einstellungen hinterlegen')
      return
    }

    const needByDate = new Date(formData.needByDate)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 7)
    
    if (needByDate < minDate) {
      setError('Das Benötigt-bis Datum muss mindestens 7 Tage in der Zukunft liegen')
      return
    }

    setLoading(true)

    try {
      // Build additionalNotes with mixed tire info if applicable
      let notesText = formData.additionalNotes || ''
      
      // Add mixed tire dimensions to notes
      if (mixedTires && formData.rearWidth && formData.rearAspectRatio && formData.rearDiameter) {
        const frontDimensions = `Vorderachse: ${formData.width}/${formData.aspectRatio} R${formData.diameter}${formData.loadIndex ? ' ' + formData.loadIndex : ''}${formData.speedRating ? ' ' + formData.speedRating : ''}`
        const rearDimensions = `Hinterachse: ${formData.rearWidth}/${formData.rearAspectRatio} R${formData.rearDiameter}${formData.rearLoadIndex ? ' ' + formData.rearLoadIndex : ''}${formData.rearSpeedRating ? ' ' + formData.rearSpeedRating : ''}`
        notesText = `${frontDimensions}\n${rearDimensions}\n${notesText}`.trim()
      }
      
      // Add disposal info
      if (formData.tireDisposal) {
        notesText = `${notesText}\nAltreifenentsorgung gewünscht`.trim()
      }
      
      const response = await fetch('/api/tire-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          season: formData.season,
          width: parseInt(formData.width),
          aspectRatio: parseInt(formData.aspectRatio),
          diameter: parseInt(formData.diameter),
          loadIndex: formData.loadIndex ? parseInt(formData.loadIndex) : undefined,
          speedRating: formData.speedRating || undefined,
          isRunflat: formData.isRunflat,
          quantity: formData.quantity,
          preferredBrands: formData.preferredBrands || undefined,
          additionalNotes: notesText || undefined,
          needByDate: formData.needByDate,
          zipCode: userZipCode,
          radiusKm: formData.radiusKm,
          vehicleId: selectedVehicle || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ein Fehler ist aufgetreten')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/customer?success=tires')
      }, 2000)
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  // Calculate minimum date (7 days from now)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 7)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/customer')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Autoreifen Anfrage mit Montage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Neue Reifen kaufen und montieren lassen - Geben Sie Ihre Reifenspezifikationen an und erhalten Sie Angebote von Werkstätten in Ihrer Nähe
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">✓ Reifenanfrage erfolgreich erstellt! Werkstätten werden benachrichtigt. Sie werden weitergeleitet...</p>
            </div>
          )}

          {/* Season Selection */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
              Reifentyp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`relative flex items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.season === 'SUMMER' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <input
                  type="radio"
                  name="season"
                  value="SUMMER"
                  checked={formData.season === 'SUMMER'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-4xl mb-2">☀️</div>
                  <div className="font-semibold">Sommerreifen</div>
                </div>
              </label>

              <label className={`relative flex items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.season === 'WINTER' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <input
                  type="radio"
                  name="season"
                  value="WINTER"
                  checked={formData.season === 'WINTER'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-4xl mb-2">❄️</div>
                  <div className="font-semibold">Winterreifen</div>
                </div>
              </label>

              <label className={`relative flex items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.season === 'ALL_SEASON' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <input
                  type="radio"
                  name="season"
                  value="ALL_SEASON"
                  checked={formData.season === 'ALL_SEASON'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-4xl mb-2">🌤️</div>
                  <div className="font-semibold">Allwetterreifen</div>
                </div>
              </label>
            </div>
          </div>

          {/* Vehicle Selection */}
          {vehicles.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                Fahrzeug wählen (optional)
              </h3>
              <div className="space-y-4">
                <select
                  value={selectedVehicle}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Manuell eingeben</option>
                  {vehicles.map(vehicle => {
                    let tireInfo = ''
                    if (formData.season === 'SUMMER' && vehicle.summerTires) {
                      const t = vehicle.summerTires
                      tireInfo = ` - ${t.width}/${t.aspectRatio} R${t.diameter}`
                    } else if (formData.season === 'WINTER' && vehicle.winterTires) {
                      const t = vehicle.winterTires
                      tireInfo = ` - ${t.width}/${t.aspectRatio} R${t.diameter}`
                    } else if (formData.season === 'ALL_SEASON' && vehicle.allSeasonTires) {
                      const t = vehicle.allSeasonTires
                      tireInfo = ` - ${t.width}/${t.aspectRatio} R${t.diameter}`
                    }
                    return (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.year}){tireInfo}
                      </option>
                    )
                  })}
                </select>

                {selectedVehicle && !useManualEntry && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-700">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Reifendimensionen automatisch übernommen</span>
                    </div>
                  </div>
                )}

                {selectedVehicle && useManualEntry && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-yellow-700">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Für dieses Fahrzeug ist keine {formData.season === 'SUMMER' ? 'Sommer' : formData.season === 'WINTER' ? 'Winter' : 'Ganzjahres'}-Reifengröße hinterlegt. Bitte manuell eingeben.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tire Dimensions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">{vehicles.length > 0 ? '3' : '2'}</span>
              Reifendimensionen
            </h3>
            
            {/* Mischbereifung Checkbox - nur bei manueller Eingabe */}
            {!selectedVehicle && (
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="mixedTires"
                  checked={mixedTires}
                  onChange={(e) => setMixedTires(e.target.checked)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="mixedTires" className="ml-2 text-sm font-medium text-gray-700">
                  Mischbereifung (unterschiedliche Größen vorne und hinten)
                </label>
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Format: Breite / Querschnitt R Zoll Tragfähigkeit Geschwindigkeit (z.B. 205/55 R16 91V)
            </p>
            
            {/* Vorderreifen Überschrift bei Mischbereifung */}
            {mixedTires && (
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Vorderreifen
              </h4>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breite (mm) *
                </label>
                <select
                  name="width"
                  required
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen</option>
                  {TIRE_WIDTHS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Querschnitt (%) *
                </label>
                <select
                  name="aspectRatio"
                  required
                  value={formData.aspectRatio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen</option>
                  {ASPECT_RATIOS.map(ar => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoll *
                </label>
                <select
                  name="diameter"
                  required
                  value={formData.diameter}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen</option>
                  {DIAMETERS.map(d => (
                    <option key={d} value={d}>{d}"</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tragfähigkeit *
                </label>
                <select
                  name="loadIndex"
                  required
                  value={formData.loadIndex}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen</option>
                  {LOAD_INDICES.map(li => (
                    <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geschwindigkeit *
                </label>
                <select
                  name="speedRating"
                  required
                  value={formData.speedRating}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen</option>
                  {SPEED_RATINGS.map(sr => (
                    <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Vorderreifen */}
            {formData.width && formData.aspectRatio && formData.diameter && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm font-medium text-primary-800">
                  {mixedTires ? 'Vorderreifen: ' : 'Ausgewählte Reifengröße: '}<span className="text-2xl font-bold">
                    {formData.width}/{formData.aspectRatio} R{formData.diameter}
                    {formData.loadIndex && ` ${formData.loadIndex}`}
                    {formData.speedRating && formData.speedRating}
                  </span>
                </p>
              </div>
            )}

            {/* Hinterreifen Dimensionen - nur bei Mischbereifung */}
            {mixedTires && (
              <>
                <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
                  Hinterreifen
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breite (mm) *
                    </label>
                    <select
                      name="rearWidth"
                      required={mixedTires}
                      value={formData.rearWidth}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wählen</option>
                      {TIRE_WIDTHS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Querschnitt (%) *
                    </label>
                    <select
                      name="rearAspectRatio"
                      required={mixedTires}
                      value={formData.rearAspectRatio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wählen</option>
                      {ASPECT_RATIOS.map(ar => (
                        <option key={ar} value={ar}>{ar}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zoll *
                    </label>
                    <select
                      name="rearDiameter"
                      required={mixedTires}
                      value={formData.rearDiameter}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wählen</option>
                      {DIAMETERS.map(d => (
                        <option key={d} value={d}>{d}"</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tragfähigkeit *
                    </label>
                    <select
                      name="rearLoadIndex"
                      required={mixedTires}
                      value={formData.rearLoadIndex}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wählen</option>
                      {LOAD_INDICES.map(li => (
                        <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Geschwindigkeit *
                    </label>
                    <select
                      name="rearSpeedRating"
                      required={mixedTires}
                      value={formData.rearSpeedRating}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Wählen</option>
                      {SPEED_RATINGS.map(sr => (
                        <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview Hinterreifen */}
                {formData.rearWidth && formData.rearAspectRatio && formData.rearDiameter && (
                  <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-sm font-medium text-primary-800">
                      Hinterreifen: <span className="text-2xl font-bold">
                        {formData.rearWidth}/{formData.rearAspectRatio} R{formData.rearDiameter}
                        {formData.rearLoadIndex && ` ${formData.rearLoadIndex}`}
                        {formData.rearSpeedRating && formData.rearSpeedRating}
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tire Quality */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">{vehicles.length > 0 ? '4' : '3'}</span>
              Reifenqualität
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.tireQuality === 'BUDGET' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <input
                  type="radio"
                  name="tireQuality"
                  value="BUDGET"
                  checked={formData.tireQuality === 'BUDGET'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="font-bold text-lg">Budget-Reifen</div>
                  <div className="text-sm text-gray-600 mt-1">Günstige Option für Wenigfahrer</div>
                </div>
              </label>

              <label className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.tireQuality === 'QUALITY' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <input
                  type="radio"
                  name="tireQuality"
                  value="QUALITY"
                  checked={formData.tireQuality === 'QUALITY'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-bold text-lg">Qualitäts-Reifen</div>
                  <div className="text-sm text-gray-600 mt-1">Gutes Preis-Leistungs-Verhältnis</div>
                </div>
              </label>

              <label className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.tireQuality === 'PREMIUM' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <input
                  type="radio"
                  name="tireQuality"
                  value="PREMIUM"
                  checked={formData.tireQuality === 'PREMIUM'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">👑</div>
                  <div className="font-bold text-lg">Premium-Reifen</div>
                  <div className="text-sm text-gray-600 mt-1">Markenreifen höchster Qualität</div>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">{vehicles.length > 0 ? '5' : '4'}</span>
              Weitere Optionen
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRunflat"
                  name="isRunflat"
                  checked={formData.isRunflat}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isRunflat" className="ml-3 text-sm font-medium text-gray-700">
                  Runflat-Reifen (selbsttragende Reifen)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tireDisposal"
                  name="tireDisposal"
                  checked={formData.tireDisposal}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="tireDisposal" className="ml-3 text-sm font-medium text-gray-700">
                  Altreifenentsorgung gewünscht
                </label>
              </div>

              {/* Tire Position Selection (nur bei unterschiedlichen Größen) */}
              {selectedVehicle && (() => {
                const vehicle = vehicles.find(v => v.id === selectedVehicle)
                let hasDifferentSizes = false
                if (formData.season === 'SUMMER' && vehicle?.summerTires?.hasDifferentSizes) hasDifferentSizes = true
                if (formData.season === 'WINTER' && vehicle?.winterTires?.hasDifferentSizes) hasDifferentSizes = true
                if (formData.season === 'ALL_SEASON' && vehicle?.allSeasonTires?.hasDifferentSizes) hasDifferentSizes = true
                
                if (hasDifferentSizes) {
                  return (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        ⚠️ Dieses Fahrzeug hat unterschiedliche Reifengrößen vorne und hinten. Welche Reifen benötigen Sie?
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tirePosition"
                            value="FRONT"
                            checked={formData.tirePosition === 'FRONT'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Nur Vorderreifen</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tirePosition"
                            value="REAR"
                            checked={formData.tirePosition === 'REAR'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Nur Hinterreifen</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="tirePosition"
                            value="BOTH"
                            checked={formData.tirePosition === 'BOTH'}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Alle vier Reifen (vorne + hinten)</span>
                        </label>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Anzahl der Reifen - nur anzeigen wenn KEINE Mischbereifung */}
              {!mixedTires && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anzahl der Reifen
                  </label>
                  {formData.tirePosition !== 'BOTH' ? (
                    <div className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                      {formData.quantity} Reifen (automatisch gesetzt)
                    </div>
                  ) : (
                    <select
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={2}>2 Reifen</option>
                      <option value={4}>4 Reifen</option>
                    </select>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    💡 {formData.tirePosition !== 'BOTH' ? 'Anzahl wird automatisch durch Ihre Auswahl bestimmt' : 'Montagepreise sind für 2 oder 4 Reifen verfügbar'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bevorzugte Hersteller (optional)
                </label>
                <input
                  type="text"
                  name="preferredBrands"
                  value={formData.preferredBrands}
                  onChange={handleChange}
                  placeholder="z.B. Continental, Michelin, Bridgestone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">Mehrere Hersteller mit Komma trennen</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zusätzliche Hinweise (optional)
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="z.B. Besondere Anforderungen, Montage-Wünsche..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Timing */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">{vehicles.length > 0 ? '6' : '5'}</span>
              Standort & Zeitrahmen
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benötigt bis *
                </label>
                <input
                  type="date"
                  name="needByDate"
                  required
                  value={formData.needByDate}
                  onChange={handleChange}
                  min={minDateString}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">Mindestens 7 Tage im Voraus</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suchradius: {formData.radiusKm} km
                </label>
                <input
                  type="range"
                  name="radiusKm"
                  min="5"
                  max="100"
                  step="5"
                  value={formData.radiusKm}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Anfrage wird erstellt...' : 'Reifenanfrage absenden'}
            </button>
            <p className="mt-3 text-center text-sm text-gray-600">
              Nach dem Absenden werden Werkstätten in Ihrer Nähe benachrichtigt und können Ihnen Angebote unterbreiten.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
