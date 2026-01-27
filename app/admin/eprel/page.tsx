'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Download, CheckCircle, XCircle, Clock, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface ImportRecord {
  id: string
  status: string
  tiresImported: number
  tiresUpdated: number
  tiresDeleted: number
  errorMessage?: string
  dataVersion?: string
  startedAt: string
  completedAt?: string
}

interface Tire {
  id: string
  eprelId: string | null
  supplierName: string
  modelName: string
  tyreDimension: string
  width: number
  aspectRatio: number
  diameter: number
  loadIndex: string | null
  speedRating: string | null
  tyreClass: string | null
  has3PMSF: boolean
  hasIceGrip: boolean
  fuelEfficiencyClass: string | null
  wetGripClass: string | null
  externalRollingNoiseLevel: number | null
  externalRollingNoiseClass: string | null
  importedAt: string
}

export default function EPRELManagementPage() {
  const [imports, setImports] = useState<ImportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [stats, setStats] = useState<{ total: number } | null>(null)
  
  // Search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<Tire[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    q: '',
    supplier: '',
    model: '',
    width: '',
    aspectRatio: '',
    diameter: '',
    tyreClass: '',
    fuelEfficiency: '',
    wetGrip: '',
    has3PMSF: '',
    hasIceGrip: ''
  })

  useEffect(() => {
    fetchImports()
    fetchStats()
  }, [])

  const fetchImports = async () => {
    try {
      const response = await fetch('/api/admin/eprel/import')
      if (response.ok) {
        const data = await response.json()
        setImports(data)
      }
    } catch (error) {
      console.error('Error fetching imports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/eprel/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const searchTires = async (page = 1) => {
    setSearchLoading(true)
    setCurrentPage(page)
    
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('page', page.toString())
      params.append('limit', '50')
      
      const response = await fetch(`/api/admin/eprel/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotalResults(data.pagination.total)
        setShowSearch(true)
      }
    } catch (error) {
      console.error('Error searching tires:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const resetFilters = () => {
    setFilters({
      q: '',
      supplier: '',
      model: '',
      width: '',
      aspectRatio: '',
      diameter: '',
      tyreClass: '',
      fuelEfficiency: '',
      wetGrip: '',
      has3PMSF: '',
      hasIceGrip: ''
    })
    setSearchResults([])
    setShowSearch(false)
    setCurrentPage(1)
  }

  const startImport = async () => {
    if (!confirm('EPREL-Datenbank jetzt importieren? Dies kann mehrere Minuten dauern.')) {
      return
    }

    setImporting(true)
    try {
      const response = await fetch('/api/admin/eprel/import', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Import gestartet! Import-ID: ${result.importId}`)
        pollImportStatus(result.importId)
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error starting import:', error)
      alert('Fehler beim Starten des Imports')
    } finally {
      setImporting(false)
    }
  }

  const pollImportStatus = async (importId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/eprel/import?importId=${importId}`)
        if (response.ok) {
          const importRecord = await response.json()
          
          setImports(prev => {
            const index = prev.findIndex(i => i.id === importId)
            if (index >= 0) {
              const newImports = [...prev]
              newImports[index] = importRecord
              return newImports
            }
            return [importRecord, ...prev]
          })

          if (importRecord.status !== 'RUNNING') {
            clearInterval(pollInterval)
            fetchStats()
            
            if (importRecord.status === 'SUCCESS') {
              alert(`Import erfolgreich!\n${importRecord.tiresImported} neu, ${importRecord.tiresUpdated} aktualisiert`)
            } else {
              alert(`Import fehlgeschlagen: ${importRecord.errorMessage}`)
            }
          }
        }
      } catch (error) {
        console.error('Error polling import status:', error)
        clearInterval(pollInterval)
      }
    }, 3000)

    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'RUNNING':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'FAILED':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'RUNNING':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade EPREL-Verwaltung...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">EPREL Reifendatenbank</h1>
            <p className="text-gray-600 mt-1">EU Tire Label Daten verwalten und durchsuchen</p>
          </div>
        </div>
        <Button
          onClick={startImport}
          disabled={importing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {importing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Importiere...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Jetzt importieren
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Reifen in Datenbank</div>
              <div className="text-2xl font-bold">
                {stats ? stats.total.toLocaleString('de-DE') : '...'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Letzter Import</div>
              <div className="text-2xl font-bold">
                {imports[0] && imports[0].status === 'SUCCESS' 
                  ? new Date(imports[0].completedAt!).toLocaleDateString('de-DE')
                  : 'Nie'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Reifen durchsuchen</div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="mt-1"
              >
                <Filter className="h-4 w-4 mr-2" />
                Suchfilter
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Filters */}
      {showFilters && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Reifen suchen</h2>
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Allgemeine Suche</label>
              <input
                type="text"
                placeholder="Hersteller, Modell oder Dimension..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hersteller</label>
              <input
                type="text"
                placeholder="z.B. Continental, Michelin..."
                value={filters.supplier}
                onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Modell</label>
              <input
                type="text"
                placeholder="z.B. PremiumContact..."
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Breite (mm)</label>
              <input
                type="number"
                placeholder="z.B. 205"
                value={filters.width}
                onChange={(e) => setFilters({ ...filters, width: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Querschnitt (%)</label>
              <input
                type="number"
                placeholder="z.B. 55"
                value={filters.aspectRatio}
                onChange={(e) => setFilters({ ...filters, aspectRatio: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Durchmesser (Zoll)</label>
              <input
                type="number"
                placeholder="z.B. 16"
                value={filters.diameter}
                onChange={(e) => setFilters({ ...filters, diameter: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reifenklasse</label>
              <select
                value={filters.tyreClass}
                onChange={(e) => setFilters({ ...filters, tyreClass: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Alle</option>
                <option value="summer">Sommerreifen</option>
                <option value="winter">Winterreifen</option>
                <option value="all-season">Ganzjahresreifen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kraftstoffeffizienz</label>
              <select
                value={filters.fuelEfficiency}
                onChange={(e) => setFilters({ ...filters, fuelEfficiency: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Alle</option>
                <option value="A">A (Beste)</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nasshaftung</label>
              <select
                value={filters.wetGrip}
                onChange={(e) => setFilters({ ...filters, wetGrip: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Alle</option>
                <option value="A">A (Beste)</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">3PMSF Symbol</label>
              <select
                value={filters.has3PMSF}
                onChange={(e) => setFilters({ ...filters, has3PMSF: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Egal</option>
                <option value="true">Ja (Schneeflocke)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ice Grip Symbol</label>
              <select
                value={filters.hasIceGrip}
                onChange={(e) => setFilters({ ...filters, hasIceGrip: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Egal</option>
                <option value="true">Ja</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => searchTires(1)}
              disabled={searchLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {searchLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Suche...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Suchen
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {showSearch && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Suchergebnisse ({totalResults.toLocaleString('de-DE')} Reifen)
            </h2>
            <Button
              onClick={() => setShowSearch(false)}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Schließen
            </Button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Reifen gefunden</p>
              <p className="text-sm mt-2">Versuche andere Suchkriterien</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Hersteller</th>
                      <th className="px-4 py-3 text-left font-medium">Modell</th>
                      <th className="px-4 py-3 text-left font-medium">Dimension</th>
                      <th className="px-4 py-3 text-left font-medium">Klasse</th>
                      <th className="px-4 py-3 text-center font-medium">Fuel</th>
                      <th className="px-4 py-3 text-center font-medium">Wet</th>
                      <th className="px-4 py-3 text-center font-medium">dB</th>
                      <th className="px-4 py-3 text-center font-medium">3PMSF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {searchResults.map((tire) => (
                      <tr key={tire.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{tire.supplierName}</td>
                        <td className="px-4 py-3">{tire.modelName}</td>
                        <td className="px-4 py-3 font-mono">
                          {tire.tyreDimension}
                          {tire.loadIndex && tire.speedRating && (
                            <span className="text-gray-500 ml-1">
                              {tire.loadIndex}{tire.speedRating}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tire.tyreClass === 'summer' ? 'bg-yellow-100 text-yellow-800' :
                            tire.tyreClass === 'winter' ? 'bg-blue-100 text-blue-800' :
                            tire.tyreClass === 'all-season' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tire.tyreClass === 'summer' ? 'Sommer' :
                             tire.tyreClass === 'winter' ? 'Winter' :
                             tire.tyreClass === 'all-season' ? 'Ganzjahr' :
                             tire.tyreClass || 'k.A.'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded font-semibold ${
                            tire.fuelEfficiencyClass === 'A' ? 'bg-green-100 text-green-800' :
                            tire.fuelEfficiencyClass === 'B' ? 'bg-lime-100 text-lime-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tire.fuelEfficiencyClass || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded font-semibold ${
                            tire.wetGripClass === 'A' ? 'bg-green-100 text-green-800' :
                            tire.wetGripClass === 'B' ? 'bg-lime-100 text-lime-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tire.wetGripClass || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tire.externalRollingNoiseLevel ? (
                            <span className="text-gray-700">
                              {tire.externalRollingNoiseLevel} dB
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tire.has3PMSF ? '❄️' : '-'}
                          {tire.hasIceGrip && ' 🧊'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Seite {currentPage} von {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => searchTires(currentPage - 1)}
                      disabled={currentPage === 1 || searchLoading}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Zurück
                    </Button>
                    <Button
                      onClick={() => searchTires(currentPage + 1)}
                      disabled={currentPage === totalPages || searchLoading}
                      variant="outline"
                      size="sm"
                    >
                      Weiter
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Import History */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Import-Verlauf</h2>
        
        {imports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Imports durchgeführt</p>
            <p className="text-sm mt-2">Starte den ersten Import mit dem Button oben</p>
          </div>
        ) : (
          <div className="space-y-4">
            {imports.map((importRecord) => (
              <div
                key={importRecord.id}
                className={`p-4 rounded-lg border ${getStatusColor(importRecord.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(importRecord.status)}
                    <div>
                      <div className="font-semibold">
                        {importRecord.status === 'RUNNING' && 'Import läuft...'}
                        {importRecord.status === 'SUCCESS' && 'Import erfolgreich'}
                        {importRecord.status === 'FAILED' && 'Import fehlgeschlagen'}
                      </div>
                      <div className="text-sm opacity-75">
                        Gestartet: {new Date(importRecord.startedAt).toLocaleString('de-DE')}
                        {importRecord.completedAt && (
                          <> • Beendet: {new Date(importRecord.completedAt).toLocaleString('de-DE')}</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">
                      {importRecord.tiresImported > 0 && (
                        <span className="text-green-600">
                          +{importRecord.tiresImported.toLocaleString('de-DE')} neu
                        </span>
                      )}
                      {importRecord.tiresUpdated > 0 && (
                        <span className="text-blue-600 ml-2">
                          {importRecord.tiresUpdated.toLocaleString('de-DE')} aktualisiert
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {importRecord.errorMessage && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-800">
                    <strong>Fehler:</strong> {importRecord.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Information */}
      <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Über EPREL</h3>
        <p className="text-sm text-blue-800">
          Die EPREL-Datenbank (European Product Database for Energy Labelling) enthält offizielle 
          EU-Reifenlabel-Daten für alle in der EU verkauften Reifen. Die Daten werden wöchentlich 
          automatisch aktualisiert. Ein manueller Import dauert ca. 5-10 Minuten und lädt ca. 60 MB 
          komprimierte Daten herunter.
        </p>
      </Card>
    </div>
  )
}
