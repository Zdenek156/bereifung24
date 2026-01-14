'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, MapPin, Star, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  googlePlaceId: string
  name: string
  address: string
  city: string
  postalCode: string
  phone?: string
  website?: string
  rating?: number
  reviewCount: number
  photoUrls: string[]
  latitude: number
  longitude: number
  leadScore: number
  isExisting: boolean
  existingId?: string
}

export default function SalesSearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)

  // Search parameters
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(10000)
  const [keyword, setKeyword] = useState('Reifenservice Werkstatt')

  // Results
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user) {
      router.push('/login')
      return
    }
  }, [status, session, router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!location) {
      alert('Bitte gib einen Ort ein')
      return
    }

    setSearching(true)
    setResults([])
    setSelectedIds(new Set())

    try {
      const response = await fetch('/api/sales/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          radius,
          keyword
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Suche fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Fehler bei der Suche')
    } finally {
      setSearching(false)
    }
  }

  const toggleSelection = (placeId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId)
    } else {
      newSelected.add(placeId)
    }
    setSelectedIds(newSelected)
  }

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      alert('Bitte wähle mindestens eine Werkstatt aus')
      return
    }

    setImporting(true)

    try {
      const selectedResults = results.filter(r => selectedIds.has(r.googlePlaceId))
      
      const response = await fetch('/api/sales/import-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospects: selectedResults,
          assignToMe: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Erfolgreich ${data.imported} Werkstätten importiert!`)
        router.push('/admin/sales-v2/prospects')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Import fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Fehler beim Import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/sales-v2"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Werkstätten suchen</h1>
              <p className="text-sm text-gray-600">Google Places Integration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ort / PLZ
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. Berlin oder 10115"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius (km)
                </label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="5000">5 km</option>
                  <option value="10000">10 km</option>
                  <option value="25000">25 km</option>
                  <option value="50000">50 km</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suchbegriff
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Reifenservice Werkstatt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex items-center justify-center"
            >
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Suche läuft...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Werkstätten suchen
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {results.length} Werkstätten gefunden
                </p>
                <p className="text-sm text-gray-600">
                  {selectedIds.size} ausgewählt
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={selectedIds.size === 0 || importing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Importiere...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Ausgewählte importieren
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <div
                  key={result.googlePlaceId}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                    selectedIds.has(result.googlePlaceId)
                      ? 'ring-2 ring-primary-500 shadow-lg'
                      : 'hover:shadow-lg'
                  } ${result.isExisting ? 'opacity-60' : ''}`}
                  onClick={() => !result.isExisting && toggleSelection(result.googlePlaceId)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {result.name}
                    </h3>
                    {selectedIds.has(result.googlePlaceId) && (
                      <div className="bg-primary-100 text-primary-700 p-2 rounded-full">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{result.address}, {result.postalCode} {result.city}</span>
                    </div>

                    {result.rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-400 fill-current" />
                        <span>{result.rating.toFixed(1)} ({result.reviewCount} Bewertungen)</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.leadScore >= 70
                          ? 'bg-green-100 text-green-800'
                          : result.leadScore >= 40
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Lead Score: {result.leadScore}/100
                      </span>
                    </div>

                    {result.isExisting && (
                      <div className="pt-2">
                        <Link
                          href={`/admin/sales-v2/prospects/${result.existingId}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Bereits im System →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!searching && results.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Suchergebnisse
            </h3>
            <p className="text-gray-600">
              Starte eine Suche um Werkstätten in deiner Nähe zu finden
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
