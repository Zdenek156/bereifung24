'use client'

import { useState, useEffect } from 'react'

interface Invoice {
  id: string
  invoiceNumber: string
  periodStart: string
  periodEnd: string
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  sentAt: string | null
  paidAt: string | null
  dueDate: string | null
  pdfUrl: string | null
  createdAt: string
}

export default function WorkshopInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const res = await fetch('/api/workshop/invoices')
      const data = await res.json()
      if (data.invoices) {
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    setDownloading(invoiceId)
    try {
      const res = await fetch(`/api/workshop/invoices/${invoiceId}/download`)
      if (!res.ok) throw new Error('Download failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber.replace(/\//g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Fehler beim Herunterladen der Rechnung')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatPeriod = (start: string, end: string) => {
    const d = new Date(end)
    return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  // Get available years
  const availableYears = [...new Set(invoices.map(inv => new Date(inv.periodEnd).getFullYear()))].sort((a, b) => b - a)

  const filteredInvoices = invoices.filter(inv => new Date(inv.periodEnd).getFullYear() === filterYear)

  // Stats
  const totalAmount = filteredInvoices.reduce((sum, inv) => inv.status !== 'CANCELLED' ? sum + inv.totalAmount : sum, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">B24 Rechnungen</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ihre Provisionsabrechnungen von Bereifung24</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Stats Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-4 text-sm overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Gesamt {filterYear}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Rechnungen:</span>
            <span className="font-medium text-gray-900 dark:text-white">{filteredInvoices.length}</span>
          </div>
        </div>

        {/* Year Filter Pills */}
        {availableYears.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setFilterYear(year)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterYear === year
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredInvoices.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Keine Rechnungen vorhanden</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {availableYears.length > 0
                ? `Für ${filterYear} wurden keine Rechnungen erstellt.`
                : 'Es wurden noch keine Provisionsabrechnungen erstellt.'}
            </p>
          </div>
        )}

        {/* Invoice List */}
        {!loading && filteredInvoices.length > 0 && (
          <div className="space-y-2">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 border-l-primary-500 overflow-hidden"
              >
                <div className="flex items-center px-3 py-2.5">
                  {/* Invoice Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatPeriod(invoice.periodStart, invoice.periodEnd)}</span>
                  </div>

                  {/* Amount */}
                  <div className="text-right mr-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.totalAmount)}</span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500">inkl. MwSt.</span>
                  </div>

                  {/* Download Button */}
                  {invoice.pdfUrl && (
                    <button
                      onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                      disabled={downloading === invoice.id}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-800 transition-colors disabled:opacity-50"
                      title="PDF herunterladen"
                    >
                      {downloading === invoice.id ? (
                        <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Provisionsabrechnungen werden monatlich automatisch erstellt und per E-Mail versendet. Die Provision wird direkt bei jeder Online-Zahlung einbehalten.</span>
        </div>
      </div>
    </div>
  )
}
