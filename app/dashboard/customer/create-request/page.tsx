'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TIRE_WIDTHS = [135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325]
const ASPECT_RATIOS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
const DIAMETERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
const LOAD_INDICES = Array.from({ length: 101 }, (_, i) => 50 + i) // 50-150
const SPEED_RATINGS = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'ZR']

export default function CreateRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    season: 'SUMMER',
    width: '',
    aspectRatio: '',
    diameter: '',
    loadIndex: '',
    speedRating: '',
    isRunflat: false,
    quantity: 4,
    preferredBrands: '',
    additionalNotes: '',
    needByDate: '',
    zipCode: '',
    radiusKm: 25,
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    if (!formData.zipCode) {
      setError('Bitte Postleitzahl angeben')
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
          additionalNotes: formData.additionalNotes || undefined,
          needByDate: formData.needByDate,
          zipCode: formData.zipCode,
          radiusKm: formData.radiusKm,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ein Fehler ist aufgetreten')
        setLoading(false)
        return
      }

      alert('Reifenanfrage erfolgreich erstellt! Werkstätten werden nun benachrichtigt.')
      router.push('/dashboard/customer/requests')
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
          <h1 className="text-4xl font-bold text-gray-900">Neue Reifenanfrage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Geben Sie Ihre Reifenspezifikationen an und erhalten Sie Angebote von Werkstätten in Ihrer Nähe
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
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

          {/* Tire Dimensions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
              Reifendimensionen
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Format: Breite / Querschnitt R Zoll (z.B. 205/55 R16)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <option value="">Bitte wählen</option>
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
                  <option value="">Bitte wählen</option>
                  {ASPECT_RATIOS.map(ar => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoll (Durchmesser) *
                </label>
                <select
                  name="diameter"
                  required
                  value={formData.diameter}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen</option>
                  {DIAMETERS.map(d => (
                    <option key={d} value={d}>{d}"</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            {formData.width && formData.aspectRatio && formData.diameter && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm font-medium text-primary-800">
                  Ausgewählte Dimension: <span className="text-2xl font-bold">{formData.width}/{formData.aspectRatio} R{formData.diameter}</span>
                </p>
              </div>
            )}
          </div>

          {/* Load Index & Speed Rating */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
              Tragfähigkeit & Geschwindigkeitsindex (optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tragfähigkeitsindex
                </label>
                <select
                  name="loadIndex"
                  value={formData.loadIndex}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Keine Angabe</option>
                  {LOAD_INDICES.map(li => (
                    <option key={li} value={li}>{li}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geschwindigkeitsindex
                </label>
                <select
                  name="speedRating"
                  value={formData.speedRating}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Keine Angabe</option>
                  {SPEED_RATINGS.map(sr => (
                    <option key={sr} value={sr}>{sr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">4</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anzahl der Reifen
                </label>
                <select
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1 Reifen</option>
                  <option value={2}>2 Reifen</option>
                  <option value={4}>4 Reifen</option>
                </select>
              </div>

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
              <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">5</span>
              Standort & Zeitrahmen
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postleitzahl *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="12345"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

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
