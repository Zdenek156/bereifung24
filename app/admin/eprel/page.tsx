'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
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

export default function EPRELManagementPage() {
  const [imports, setImports] = useState<ImportRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [stats, setStats] = useState<{ total: number } | null>(null)

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
        
        // Poll for status
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
          
          // Update imports list
          setImports(prev => {
            const index = prev.findIndex(i => i.id === importId)
            if (index >= 0) {
              const newImports = [...prev]
              newImports[index] = importRecord
              return newImports
            }
            return [importRecord, ...prev]
          })

          // Stop polling if completed
          if (importRecord.status !== 'RUNNING') {
            clearInterval(pollInterval)
            fetchStats() // Refresh stats
            
            if (importRecord.status === 'SUCCESS') {
              alert(`Import erfolgreich abgeschlossen!\n${importRecord.tiresImported} Reifen importiert, ${importRecord.tiresUpdated} aktualisiert`)
            } else {
              alert(`Import fehlgeschlagen: ${importRecord.errorMessage}`)
            }
          }
        }
      } catch (error) {
        console.error('Error polling import status:', error)
        clearInterval(pollInterval)
      }
    }, 3000) // Poll every 3 seconds

    // Stop polling after 30 minutes
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
            <p className="text-gray-600 mt-1">EU Tire Label Daten verwalten</p>
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
            <RefreshCw className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Update-Intervall</div>
              <div className="text-2xl font-bold">Wöchentlich</div>
            </div>
          </div>
        </Card>
      </div>

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
