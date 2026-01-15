'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, MapPin, Star, TrendingUp, ArrowLeft, Plus, Info } from 'lucide-react'
import ProspectDetailDialog from '@/components/ProspectDetailDialog'

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface SearchResult {
  placeId: string
  name: string
  address: string
  street: string
  city: string
  postalCode: string
  latitude: number
  longitude: number
  rating?: number
  reviewCount: number
  photoUrl?: string
  photoUrls?: string[]
  phone?: string
  website?: string
  openingHours?: string[]
  priceLevel?: number
  leadScore: number
  leadScoreBreakdown?: { label: string; points: number }[]
  alreadyExists: boolean
  prospectId?: string
}

export default function SalesSearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  
  // Search params
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(10000)
  const [keyword, setKeyword] = useState('Reifenservice Werkstatt')
  const [country, setCountry] = useState('DE')
  const [searchLocation, setSearchLocation] = useState({ lat: 0, lng: 0 })
  
  // Results
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set())
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<SearchResult | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user) {
      router.push('/login')
      return
    }
  }, [status, session, router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!location.trim()) {
      alert('Bitte Standort eingeben')
      return
    }

    setSearching(true)
    setResults([])
    setSelectedPlaces(new Set())

    try {
      const response = await fetch('/api/sales/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, radius, keyword, country })
      })

      if (response.ok) {
        const data = await response.json()
        // Map API response to match SearchResult interface
        const mappedResults = data.results.map((result: any) => ({
          placeId: result.googlePlaceId,
          name: result.name,
          address: result.address,
          street: result.street,
          city: result.city,
          postalCode: result.postalCode,
          latitude: result.latitude,
          longitude: result.longitude,
          rating: result.rating,
          reviewCount: result.reviewCount,
          photoUrls: result.photoUrls,
          phone: result.phone,
          website: result.website,
          openingHours: result.openingHours,
          priceLevel: result.priceLevel,
          leadScore: result.leadScore,
          leadScoreBreakdown: result.leadScoreBreakdown,
          alreadyExists: result.isExisting,
          prospectId: result.existingId
        }))
        setResults(mappedResults)
        setNextPageToken(data.nextPageToken || null)
        if (data.searchLocation) {
          setSearchLocation(data.searchLocation)
        }
      } else {
        alert('Fehler bei der Suche')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Fehler bei der Suche')
    } finally {
      setSearching(false)
    }
  }

  const loadMoreResults = async () => {
    if (!nextPageToken || loadingMore) return

    setLoadingMore(true)
    try {
      const response = await fetch('/api/sales/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageToken: nextPageToken })
      })

      if (response.ok) {
        const data = await response.json()
        const mappedResults = data.results.map((result: any) => ({
          placeId: result.googlePlaceId,
          name: result.name,
          address: result.address,
          street: result.street,
          city: result.city,
          postalCode: result.postalCode,
          latitude: result.latitude,
          longitude: result.longitude,
          rating: result.rating,
          reviewCount: result.reviewCount,
          photoUrls: result.photoUrls,
          phone: result.phone,
          website: result.website,
          openingHours: result.openingHours,
          priceLevel: result.priceLevel,
          leadScore: result.leadScore,
          leadScoreBreakdown: result.leadScoreBreakdown,
          alreadyExists: result.isExisting,
          prospectId: result.existingId
        }))
        // Append new results to existing ones
        setResults(prev => [...prev, ...mappedResults])
        setNextPageToken(data.nextPageToken || null)
      } else {
        alert('Fehler beim Laden weiterer Ergebnisse')
      }
    } catch (error) {
      console.error('Load more error:', error)
      alert('Fehler beim Laden weiterer Ergebnisse')
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleSelection = (placeId: string) => {
    const newSet = new Set(selectedPlaces)
    if (newSet.has(placeId)) {
      newSet.delete(placeId)
    } else {
      newSet.add(placeId)
    }
    setSelectedPlaces(newSet)
  }

  const showDetails = (result: SearchResult) => {
    setSelectedProspect(result)
    setDetailDialogOpen(true)
  }

  const handleImportFromDialog = () => {
    if (selectedProspect) {
      setSelectedPlaces(new Set([selectedProspect.placeId]))
      setTimeout(() => {
        handleImport()
      }, 100)
    }
  }

  const handleImport = async () => {
    if (selectedPlaces.size === 0) {
      alert('Bitte mindestens eine Werkstatt auswählen')
      return
    }

    setLoading(true)
    try {
      const selectedResults = results.filter(r => selectedPlaces.has(r.placeId))
      
      const response = await fetch('/api/sales/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects: selectedResults })
      })

      if (response.ok) {
        alert(`${selectedPlaces.size} Werkstätten erfolgreich importiert!`)
        router.push('/admin/sales/prospects')
      } else {
        alert('Fehler beim Import')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Fehler beim Import')
    } finally {
      setLoading(false)
    }
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
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
                <h1 className="text-3xl font-bold text-gray-900">Werkstätten suchen</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Google Places Integration mit automatischem Lead-Scoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="DE">🇩🇪 Deutschland</option>
                  <option value="AT">🇦🇹 Österreich</option>
                  <option value="CH">🇨🇭 Schweiz</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standort (Stadt oder PLZ)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="z.B. München oder 80331"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius: {(radius / 1000).toFixed(0)} km
                </label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching || !location.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {results.length} Werkstätten gefunden · {selectedPlaces.size} ausgewählt
              </p>
              {selectedPlaces.size > 0 && (
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Importiere...' : `${selectedPlaces.size} importieren`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((result) => (
                <div
                  key={result.placeId}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                    selectedPlaces.has(result.placeId)
                      ? 'border-primary-500'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${result.alreadyExists ? 'opacity-50' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {result.photoUrls && result.photoUrls.length > 0 ? (
                          <img
                            src={result.photoUrls[0]}
                            alt={result.name}
                            className="w-20 h-20 rounded-lg object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {result.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                {result.address}
                              </div>
                              {searchLocation.lat !== 0 && result.latitude !== 0 && (
                                <div className="text-xs text-gray-500 mt-1 ml-5">
                                  {calculateDistance(
                                    searchLocation.lat,
                                    searchLocation.lng,
                                    result.latitude,
                                    result.longitude
                                  ).toFixed(1)} km entfernt
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {result.rating && (
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                  <span className="font-medium">{result.rating.toFixed(1)}</span>
                                  <span className="text-sm text-gray-600 ml-1">
                                    ({result.reviewCount})
                                  </span>
                                </div>
                              )}
                              <div 
                                className="flex items-center cursor-help" 
                                title={result.leadScoreBreakdown?.map(b => `${b.label}: ${b.points > 0 ? '+' : ''}${b.points}`).join('\n') || ''}
                              >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getLeadScoreColor(result.leadScore)}`}>
                                  Score: {result.leadScore}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Lead Score Breakdown */}
                          {result.leadScoreBreakdown && result.leadScoreBreakdown.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Lead-Score Breakdown:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {result.leadScoreBreakdown.map((item, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                      item.points > 0 
                                        ? 'bg-green-50 text-green-700' 
                                        : item.points < 0 
                                        ? 'bg-red-50 text-red-700' 
                                        : 'bg-gray-50 text-gray-600'
                                    }`}
                                  >
                                    {item.label}: {item.points > 0 ? '+' : ''}{item.points}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => showDetails(result)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </button>
                        {result.alreadyExists && (
                          <span className="text-sm text-gray-600">
                            Bereits als Prospect vorhanden
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleSelection(result.placeId)}
                        disabled={result.alreadyExists}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedPlaces.has(result.placeId)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedPlaces.has(result.placeId) ? '✓ Ausgewählt' : 'Auswählen'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {nextPageToken && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMoreResults}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Lade weitere Ergebnisse...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Mehr Werkstätten laden
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Es sind weitere Ergebnisse verfügbar
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <ProspectDetailDialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        prospect={selectedProspect}
        onImport={handleImportFromDialog}
      />
    </div>
  )
}
