'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [format, setFormat] = useState<'DATEV' | 'EXCEL' | 'PDF'>('DATEV')
  const [period, setPeriod] = useState<'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM'>('MONTH')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1)
  const [onlyLocked, setOnlyLocked] = useState(true)
  const [includeDocuments, setIncludeDocuments] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  const getDateRange = () => {
    const year = selectedYear
    let startDate = ''
    let endDate = ''

    switch (period) {
      case 'MONTH':
        startDate = `${year}-${String(selectedMonth).padStart(2, '0')}-01`
        const lastDay = new Date(year, selectedMonth, 0).getDate()
        endDate = `${year}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`
        break
      case 'QUARTER':
        const quarterStartMonth = (selectedQuarter - 1) * 3 + 1
        startDate = `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`
        const quarterEndMonth = quarterStartMonth + 2
        const quarterLastDay = new Date(year, quarterEndMonth, 0).getDate()
        endDate = `${year}-${String(quarterEndMonth).padStart(2, '0')}-${quarterLastDay}`
        break
      case 'YEAR':
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
        break
      case 'CUSTOM':
        startDate = customStartDate
        endDate = customEndDate
        break
    }

    return { startDate, endDate }
  }

  const handleExport = async () => {
    const { startDate, endDate } = getDateRange()

    if (!startDate || !endDate) {
      alert('Bitte wählen Sie einen gültigen Zeitraum')
      return
    }

    setLoading(true)

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        onlyLocked: String(onlyLocked)
      })

      let endpoint = ''
      switch (format) {
        case 'DATEV':
          endpoint = '/api/admin/accounting/export/datev'
          break
        case 'EXCEL':
          endpoint = '/api/admin/accounting/export/excel'
          break
        case 'PDF':
          endpoint = '/api/admin/accounting/export/pdf'
          break
      }

      const response = await fetch(`${endpoint}?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Fehler beim Export')
        return
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from content-disposition header or generate one
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `Buchhaltung_Export_${startDate}_${endDate}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
        if (filenameMatch) filename = filenameMatch[1]
      } else {
        switch (format) {
          case 'DATEV':
            filename += '.csv'
            break
          case 'EXCEL':
            filename += '.xlsx'
            break
          case 'PDF':
            filename += '.pdf'
            break
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Export erfolgreich heruntergeladen')
    } catch (error) {
      console.error('Export error:', error)
      alert('Fehler beim Export')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const { startDate, endDate } = getDateRange()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href="/admin/buchhaltung" 
            className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
          >
            ← Zurück zur Buchhaltung
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Datenexport
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Buchhaltungsdaten für Steuerberater oder interne Auswertungen exportieren
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Export konfigurieren</h2>

          {/* Format Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export-Format
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setFormat('DATEV')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'DATEV'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-10 h-10 mb-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-semibold text-gray-900">DATEV CSV</span>
                  <span className="text-xs text-gray-500 mt-1">Für Steuerberater</span>
                </div>
              </button>

              <button
                onClick={() => setFormat('EXCEL')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'EXCEL'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-10 h-10 mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-gray-900">Excel</span>
                  <span className="text-xs text-gray-500 mt-1">Interne Auswertung</span>
                </div>
              </button>

              <button
                onClick={() => setFormat('PDF')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'PDF'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <svg className="w-10 h-10 mb-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-gray-900">PDF</span>
                  <span className="text-xs text-gray-500 mt-1">Druckbare Version</span>
                </div>
              </button>
            </div>
          </div>

          {/* Period Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Zeitraum
            </label>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => setPeriod('MONTH')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  period === 'MONTH'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Monat
              </button>
              <button
                onClick={() => setPeriod('QUARTER')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  period === 'QUARTER'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Quartal
              </button>
              <button
                onClick={() => setPeriod('YEAR')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  period === 'YEAR'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Jahr
              </button>
              <button
                onClick={() => setPeriod('CUSTOM')}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  period === 'CUSTOM'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Benutzerdefiniert
              </button>
            </div>

            {/* Period specific inputs */}
            {period === 'MONTH' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Monat</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i, 1).toLocaleDateString('de-DE', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Jahr</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {period === 'QUARTER' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Quartal</label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={1}>Q1 (Jan - März)</option>
                    <option value={2}>Q2 (Apr - Juni)</option>
                    <option value={3}>Q3 (Juli - Sep)</option>
                    <option value={4}>Q4 (Okt - Dez)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Jahr</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {period === 'YEAR' && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Jahr</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>
                      {new Date().getFullYear() - i}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {period === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Von</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Bis</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Date Range Preview */}
            {startDate && endDate && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Ausgewählter Zeitraum:</strong> {new Date(startDate).toLocaleDateString('de-DE')} bis {new Date(endDate).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Optionen
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={onlyLocked}
                  onChange={(e) => setOnlyLocked(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Nur gesperrte Buchungen exportieren
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Empfohlen für GoBD-Konformität
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Format Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {format === 'DATEV' && 'DATEV CSV Format'}
              {format === 'EXCEL' && 'Excel Format'}
              {format === 'PDF' && 'PDF Format'}
            </h3>
            <p className="text-sm text-gray-600">
              {format === 'DATEV' && (
                <>
                  Exportiert Buchungen im DATEV EXTF 510/700 Format. 
                  Diese Datei kann direkt in DATEV-Software importiert werden.
                  Enthält: Belegnummer, Buchungsdatum, Soll/Haben-Konto, Betrag, USt-Schlüssel, Buchungstext.
                </>
              )}
              {format === 'EXCEL' && (
                <>
                  Erstellt eine Excel-Datei mit mehreren Arbeitsblättern: Journal, Kontenplan, Summen & Salden.
                  Ideal für interne Auswertungen und Analysen.
                </>
              )}
              {format === 'PDF' && (
                <>
                  Erzeugt eine druckbare PDF-Datei mit allen Buchungen und Kontenplänen.
                  Geeignet für Archivierung und Präsentationen.
                </>
              )}
            </p>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={loading || !startDate || !endDate || format === 'EXCEL' || format === 'PDF'}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Exportiere...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {format === 'EXCEL' || format === 'PDF' ? 'Kommt bald' : 'Export starten'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Hinweise zum Export:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>DATEV-Exporte sollten nur gesperrte Buchungen enthalten</li>
                <li>Senden Sie die DATEV-Datei an Ihren Steuerberater</li>
                <li>Excel und PDF Exporte werden in Kürze verfügbar sein</li>
                <li>Alle Exporte sind GoBD-konform und unveränderbar</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
