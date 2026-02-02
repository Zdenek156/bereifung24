'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import BackButton from '@/components/BackButton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  TrendingUp,
  FileDown,
  Search,
  Filter,
  ChevronDown,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

interface Stats {
  totalRequests: number
  openRequests: number
  conversionRate: number
  avgResponseTimeHours: number
}

interface TireRequest {
  id: string
  type: string
  status: string
  serviceType?: string
  createdAt: string
  needByDate: string
  customer: {
    name: string
    email: string
    phone: string | null
  }
  vehicle: {
    make: string
    model: string
    year: number
    type: string
  } | null
  location: {
    zipCode: string
    city: string | null
    radiusKm: number
  }
  serviceDetails: {
    season: string
    tireSize: string
    quantity: number
    preferredBrands: string | null
    notes: string | null
  }
  offers: Array<{
    id: string
    workshopId: string
    workshopName: string
    city: string | null
    price: number
    status: string
    createdAt: string
  }>
  offersCount: number
  booking: any
  adminNotes: Array<{
    id: string
    note: string
    isImportant: boolean
    createdAt: string
    user: {
      firstName: string
      lastName: string
    }
  }>
  notesCount: number
  hasImportantNotes: boolean
}

export default function AdminTireRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [requests, setRequests] = useState<TireRequest[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [customerSearch, setCustomerSearch] = useState('')
  const [zipCodeSearch, setZipCodeSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hasOffersFilter, setHasOffersFilter] = useState('any')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [timeframe, setTimeframe] = useState('month')
  
  // UI State
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TireRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [noteIsImportant, setNoteIsImportant] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    fetchStats()
    fetchRequests()
  }, [status, session, router, currentPage, statusFilter, customerSearch, zipCodeSearch, startDate, endDate, hasOffersFilter, sortBy, sortOrder])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [timeframe])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/tire-requests/stats?timeframe=${timeframe}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.data.kpis)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder
      })

      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (customerSearch) params.append('customer', customerSearch)
      if (zipCodeSearch) params.append('zipCode', zipCodeSearch)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (hasOffersFilter !== 'any') params.append('hasOffers', hasOffersFilter)

      const response = await fetch(`/api/admin/tire-requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.data)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'excel' | 'csv') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ format })
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/admin/tire-requests/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `anfragen-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (requestId: string) => {
    if (!confirm('Möchten Sie diese Anfrage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    setDeleting(requestId)
    try {
      const response = await fetch(`/api/admin/tire-requests/${requestId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Löschen fehlgeschlagen')
      }

      // Close modal if this request was selected
      if (selectedRequest?.id === requestId) {
        setShowDetailModal(false)
        setSelectedRequest(null)
      }

      // Refresh data
      fetchStats()
      fetchRequests()
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Bitte wählen Sie mindestens eine Anfrage aus.')
      return
    }

    if (!confirm(`Möchten Sie wirklich ${selectedIds.size} Anfrage(n) löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }

    setBulkDeleting(true)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const requestId of Array.from(selectedIds)) {
      try {
        const response = await fetch(`/api/admin/tire-requests/${requestId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          successCount++
        } else {
          errorCount++
          const error = await response.json()
          errors.push(`ID ${requestId.slice(-8)}: ${error.error}`)
        }
      } catch (error) {
        errorCount++
        errors.push(`ID ${requestId.slice(-8)}: Netzwerkfehler`)
      }
    }

    setBulkDeleting(false)
    setSelectedIds(new Set())

    // Show result
    if (errorCount === 0) {
      alert(`✅ Erfolgreich ${successCount} Anfrage(n) gelöscht!`)
    } else {
      alert(`⚠️ ${successCount} erfolgreich gelöscht, ${errorCount} Fehler:\n\n${errors.join('\n')}`)
    }

    // Refresh data
    fetchStats()
    fetchRequests()
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(requests.map(r => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleAddNote = async () => {
    if (!selectedRequest || !newNote.trim()) return

    try {
      const response = await fetch(`/api/admin/tire-requests/${selectedRequest.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, isImportant: noteIsImportant })
      })

      if (response.ok) {
        setNewNote('')
        setNoteIsImportant(false)
        // Refresh request details
        fetchRequests()
        // Re-fetch selected request
        const updated = requests.find(r => r.id === selectedRequest.id)
        if (updated) {
          setSelectedRequest({...updated})
        }
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const getServiceInfo = (request: TireRequest) => {
    const serviceTypeMap: Record<string, { icon: string; name: string; color: string }> = {
      TIRE_CHANGE: { icon: '🚗', name: 'Reifenwechsel', color: 'text-blue-600' },
      WHEEL_CHANGE: { icon: '🔄', name: 'Räder Umstecken', color: 'text-green-600' },
      TIRE_REPAIR: { icon: '🔧', name: 'Reifenreparatur', color: 'text-orange-600' },
      MOTORCYCLE_TIRE: { icon: '🏍️', name: 'Motorradreifen', color: 'text-purple-600' },
      ALIGNMENT_BOTH: { icon: '📐', name: 'Achsvermessung', color: 'text-indigo-600' },
      CLIMATE_SERVICE: { icon: '❄️', name: 'Klimaservice', color: 'text-cyan-600' },
      BRAKE_SERVICE: { icon: '🛑', name: 'Bremsservice', color: 'text-red-600' },
      BATTERY_SERVICE: { icon: '🔋', name: 'Batterieservice', color: 'text-yellow-600' },
      OTHER_SERVICES: { icon: '⚙️', name: 'Sonstige Services', color: 'text-gray-600' }
    }

    const serviceType = request.serviceType || 'TIRE_CHANGE'
    const info = serviceTypeMap[serviceType] || serviceTypeMap.TIRE_CHANGE

    return { ...info, serviceType }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      OPEN: 'bg-blue-100 text-blue-800',
      QUOTED: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-600'
    }
    
    const labels: Record<string, string> = {
      PENDING: 'Ausstehend',
      OPEN: 'Offen',
      QUOTED: 'Angebote',
      ACCEPTED: 'Akzeptiert',
      REJECTED: 'Abgelehnt',
      COMPLETED: 'Abgeschlossen',
      CANCELLED: 'Storniert'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getDaysUntilNeeded = (needByDate: string) => {
    const today = new Date()
    const needed = new Date(needByDate)
    const diffTime = needed.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return <span className="text-red-600 font-semibold">Abgelaufen</span>
    if (diffDays === 0) return <span className="text-orange-600 font-semibold">Heute</span>
    if (diffDays <= 3) return <span className="text-yellow-600">in {diffDays} Tagen</span>
    return <span className="text-gray-600">in {diffDays} Tagen</span>
  }

  if (loading && requests.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Anfragen...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Anfragen-Übersicht</h1>
            <p className="text-gray-600 mt-1">Zentrale Verwaltung aller Kundenanfragen</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter {showFilters && '(aktiv)'}
          </Button>
          <div className="relative inline-block" ref={exportMenuRef}>
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              variant="outline"
              disabled={exporting}
              className="relative"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {exporting ? 'Exportiere...' : 'Exportieren'}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => {
                    handleExport('excel')
                    setShowExportMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg"
                >
                  Als Excel (.xlsx)
                </button>
                <button
                  onClick={() => {
                    handleExport('csv')
                    setShowExportMenu(false)
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 last:rounded-b-lg"
                >
                  Als CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt Anfragen</p>
                <p className="text-2xl font-bold mt-1">{stats.totalRequests}</p>
                <p className="text-xs text-gray-500 mt-1">basierend auf gewähltem Zeitraum</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="day">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
                <option value="year">Dieses Jahr</option>
                <option value="all">Gesamt</option>
              </select>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offene Anfragen</p>
                <p className="text-2xl font-bold mt-1">{stats.openRequests}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.totalRequests > 0 
                ? `${Math.round((stats.openRequests / stats.totalRequests) * 100)}% der Gesamtanfragen`
                : 'Keine Anfragen'}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold mt-1">{stats.conversionRate}%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Akzeptierte Angebote
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ø Antwortzeit</p>
                <p className="text-2xl font-bold mt-1">{stats.avgResponseTimeHours}h</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Bis zum ersten Angebot
            </p>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="ALL">Alle</option>
                <option value="PENDING">Ausstehend</option>
                <option value="OPEN">Offen</option>
                <option value="QUOTED">Angebote vorhanden</option>
                <option value="ACCEPTED">Akzeptiert</option>
                <option value="EXPIRED">Abgelaufen</option>
                <option value="REJECTED">Abgelehnt</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kunde suchen</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name oder E-Mail"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full border rounded px-3 py-2 pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">PLZ</label>
              <input
                type="text"
                placeholder="PLZ eingeben"
                value={zipCodeSearch}
                onChange={(e) => setZipCodeSearch(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Von Datum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bis Datum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Angebote</label>
              <select
                value={hasOffersFilter}
                onChange={(e) => setHasOffersFilter(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="any">Alle</option>
                <option value="true">Mit Angeboten</option>
                <option value="false">Ohne Angebote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sortieren nach</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="createdAt">Erstellungsdatum</option>
                <option value="needByDate">Benötigungsdatum</option>
                <option value="offersCount">Anzahl Angebote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reihenfolge</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="desc">Absteigend</option>
                <option value="asc">Aufsteigend</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setStatusFilter('ALL')
                  setCustomerSearch('')
                  setZipCodeSearch('')
                  setStartDate('')
                  setEndDate('')
                  setHasOffersFilter('any')
                  setSortBy('createdAt')
                  setSortOrder('desc')
                }}
                variant="outline"
                className="w-full"
              >
                Filter zurücksetzen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Requests Table */}
      <Card className="overflow-hidden">
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} Anfrage(n) ausgewählt
            </span>
            <Button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {bulkDeleting ? 'Lösche...' : 'Ausgewählte löschen'}
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === requests.length && requests.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fahrzeug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Angebote</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Benötigt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(request.id)}
                      onChange={() => toggleSelect(request.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    <div className="font-mono text-xs">#{request.id.slice(-8)}</div>
                    {request.hasImportantNotes && (
                      <span className="inline-flex items-center text-red-600" title="Wichtige Notizen">
                        <AlertCircle className="h-3 w-3" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    {new Date(request.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    <div className="font-medium">{request.customer.name}</div>
                    <div className="text-xs text-gray-500">{request.customer.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    {(() => {
                      const serviceInfo = getServiceInfo(request)
                      return (
                        <div>
                          <div className="flex items-center gap-1">
                            <span className={serviceInfo.color}>{serviceInfo.icon}</span>
                            <span className="font-medium">{serviceInfo.name}</span>
                          </div>
                          {serviceInfo.serviceType === 'TIRE_CHANGE' && (
                            <div className="text-xs text-gray-500">
                              {request.serviceDetails.season === 'SUMMER' ? 'Sommerreifen' : 
                               request.serviceDetails.season === 'WINTER' ? 'Winterreifen' : 
                               'Ganzjahresreifen'}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    {(() => {
                      const serviceType = request.serviceType || 'TIRE_CHANGE'
                      
                      // Reifen-bezogene Services
                      if (['TIRE_CHANGE', 'WHEEL_CHANGE', 'TIRE_REPAIR', 'MOTORCYCLE_TIRE'].includes(serviceType)) {
                        return (
                          <>
                            <div className="font-medium">{request.serviceDetails.tireSize || '-'}</div>
                            <div className="text-xs text-gray-500">{request.serviceDetails.quantity || 4}x Reifen</div>
                          </>
                        )
                      }
                      
                      // Sonstige Services
                      if (request.serviceDetails.notes) {
                        return (
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {request.serviceDetails.notes}
                          </div>
                        )
                      }
                      
                      return <span className="text-gray-400">-</span>
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    {request.vehicle ? (
                      <>
                        <div className="font-medium">{request.vehicle.make} {request.vehicle.model}</div>
                        <div className="text-xs text-gray-500">{request.vehicle.year}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{request.offersCount}</span>
                      {request.offersCount === 0 && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => {
                    setSelectedRequest(request)
                    setShowDetailModal(true)
                  }}>
                    {getDaysUntilNeeded(request.needByDate)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`mailto:${request.customer.email}`, '_blank')
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="E-Mail senden"
                      >
                        <Mail className="h-4 w-4 text-gray-600" />
                      </button>
                      {request.customer.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`tel:${request.customer.phone}`, '_blank')
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Anrufen"
                        >
                          <Phone className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRequest(request)
                          setShowDetailModal(true)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Details"
                      >
                        <Search className="h-4 w-4 text-gray-600" />
                      </button>                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(request.id)
                        }}
                        disabled={deleting === request.id}
                        className="p-1 hover:bg-red-100 rounded disabled:opacity-50"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Seite {currentPage} von {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Zurück
            </Button>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Weiter
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Anfrage #{selectedRequest.id.slice(-8)}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Kundeninformationen</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedRequest.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedRequest.customer.email}`} className="hover:underline">
                      {selectedRequest.customer.email}
                    </a>
                  </div>
                  {selectedRequest.customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${selectedRequest.customer.phone}`} className="hover:underline">
                        {selectedRequest.customer.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedRequest.location.zipCode} {selectedRequest.location.city}</span>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Service-Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Reifengröße:</span>
                      <div className="font-medium">{selectedRequest.serviceDetails.tireSize}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Saison:</span>
                      <div className="font-medium">{selectedRequest.serviceDetails.season}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Anzahl:</span>
                      <div className="font-medium">{selectedRequest.serviceDetails.quantity}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Bevorzugte Marken:</span>
                      <div className="font-medium">{selectedRequest.serviceDetails.preferredBrands || '-'}</div>
                    </div>
                  </div>
                  {selectedRequest.serviceDetails.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-sm text-gray-600">Zusätzliche Notizen:</span>
                      <div className="mt-1">{selectedRequest.serviceDetails.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Offers */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Angebote ({selectedRequest.offersCount})</h3>
                {selectedRequest.offers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.offers.map((offer) => (
                      <div key={offer.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{offer.workshopName}</div>
                          <div className="text-sm text-gray-600">{offer.city}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(offer.createdAt).toLocaleString('de-DE')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary-600">{offer.price.toFixed(2)} €</div>
                          <div className="text-xs text-gray-500">{offer.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-800">Noch keine Angebote vorhanden</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Admin-Notizen ({selectedRequest.notesCount})</h3>
                <div className="space-y-3">
                  {selectedRequest.adminNotes.map((note) => (
                    <div key={note.id} className={`p-4 rounded-lg ${note.isImportant ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {note.user.firstName} {note.user.lastName}
                          </span>
                          {note.isImportant && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Wichtig</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleString('de-DE')}
                        </span>
                      </div>
                      <p className="text-sm">{note.note}</p>
                    </div>
                  ))}

                  {/* Add Note Form */}
                  <div className="border-t pt-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Neue Notiz hinzufügen..."
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={noteIsImportant}
                          onChange={(e) => setNoteIsImportant(e.target.checked)}
                          className="rounded"
                        />
                        Als wichtig markieren
                      </label>
                      <Button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        size="sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Notiz hinzufügen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
