'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/components/BackButton'

interface WorkshopBooking {
  id: string
  workshopId: string
  workshopName: string
  totalBookings: number
  totalRevenue: number
  commissionNet: number
  commissionTax: number
  commissionGross: number
  hasSepaMandate: boolean
  bookings: {
    id: string
    customerName: string
    service: string
    date: string
    price: number
    commission: number
  }[]
}

interface MonthlyStats {
  year: number
  month: number
  totalWorkshops: number
  totalBookings: number
  totalRevenue: number
  totalCommissionNet: number
  totalCommissionTax: number
  totalCommissionGross: number
  workshopsWithSepa: number
  workshops: WorkshopBooking[]
}

export default function AdminBillingPage() {
  const [stats, setStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [expandedWorkshop, setExpandedWorkshop] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchMonthlyStats()
  }, [selectedYear, selectedMonth])

  const fetchMonthlyStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/billing/monthly?year=${selectedYear}&month=${selectedMonth}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch monthly stats')
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBillMonth = async () => {
    if (!confirm(`Möchten Sie wirklich für ${getMonthName(selectedMonth)} ${selectedYear} abrechnen und GoCardless-Zahlungen erstellen?`)) {
      return
    }

    try {
      setBilling(true)
      setMessage(null)
      
      const response = await fetch('/api/admin/commissions/bill-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Erfolgreich abgerechnet: ${data.summary.totalWorkshops} Werkstätten, ${data.summary.totalBookings} Buchungen, ${data.summary.totalGrossAmount.toFixed(2)}€ Gesamtbetrag` 
        })
        fetchMonthlyStats() // Reload data
      } else {
        setMessage({ type: 'error', text: data.error || 'Fehler beim Abrechnen' })
      }
    } catch (error) {
      console.error('Error billing month:', error)
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Abrechnen' })
    } finally {
      setBilling(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    return months[month - 1]
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monatliche Abrechnung</h1>
              <p className="text-gray-600 mt-1">Buchungsübersicht und GoCardless-Abrechnung</p>
            </div>
            <BackButton />
          </div>

          {/* Month/Year Selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monat</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {months.map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1"></div>
            <button
              onClick={handleBillMonth}
              disabled={billing || !stats || stats.totalBookings === 0}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {billing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Wird abgerechnet...
                </span>
              ) : (
                `${getMonthName(selectedMonth)} ${selectedYear} abrechnen`
              )}
            </button>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Werkstätten</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalWorkshops}</div>
                <div className="text-xs text-gray-500 mt-1">{stats.workshopsWithSepa} mit SEPA</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Buchungen</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
                <div className="text-xs text-gray-500 mt-1">Gesamtumsatz</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Umsatz</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)}€</div>
                <div className="text-xs text-gray-500 mt-1">Brutto</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="text-sm text-primary-700 mb-1">Provision (4,9% + MwSt)</div>
                <div className="text-3xl font-bold text-primary-900">{stats.totalCommissionGross.toFixed(2)}€</div>
                <div className="text-xs text-primary-600 mt-1">Netto: {stats.totalCommissionNet.toFixed(2)}€ + MwSt: {stats.totalCommissionTax.toFixed(2)}€</div>
              </div>
            </div>

            {/* Workshop List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Werkstätten & Buchungen</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.workshops.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Keine Buchungen für diesen Monat
                  </div>
                ) : (
                  stats.workshops.map((workshop) => (
                    <div key={workshop.workshopId} className="hover:bg-gray-50 transition-colors">
                      {/* Workshop Header */}
                      <div 
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setExpandedWorkshop(expandedWorkshop === workshop.workshopId ? null : workshop.workshopId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">{workshop.workshopName}</h3>
                              {workshop.hasSepaMandate ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  SEPA
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Kein SEPA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>{workshop.totalBookings} Buchungen</span>
                              <span>•</span>
                              <span>Umsatz: {workshop.totalRevenue.toFixed(2)}€</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-primary-600">{workshop.commissionGross.toFixed(2)}€</div>
                            <div className="text-xs text-gray-500">Netto: {workshop.commissionNet.toFixed(2)}€ + MwSt: {workshop.commissionTax.toFixed(2)}€</div>
                          </div>
                          <svg 
                            className={`w-5 h-5 ml-4 text-gray-400 transition-transform ${expandedWorkshop === workshop.workshopId ? 'transform rotate-180' : ''}`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Bookings */}
                      {expandedWorkshop === workshop.workshopId && (
                        <div className="px-6 pb-4 bg-gray-50">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Preis</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Provision (4,9%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {workshop.bookings.map((booking) => (
                                <tr key={booking.id} className="text-sm">
                                  <td className="px-3 py-2 text-gray-900">
                                    {new Date(booking.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">{booking.customerName}</td>
                                  <td className="px-3 py-2 text-gray-600">{booking.service}</td>
                                  <td className="px-3 py-2 text-right text-gray-900 font-medium">{booking.price.toFixed(2)}€</td>
                                  <td className="px-3 py-2 text-right text-primary-600 font-medium">{booking.commission.toFixed(2)}€</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
