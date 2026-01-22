'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Calendar, Filter, ChevronDown } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Invoice {
  id: string
  invoiceNumber: string
  workshopId: string
  workshop: {
    id: string
    name: string
    email?: string
  }
  periodStart: string
  periodEnd: string
  totalAmount: number
  status: string
  sentAt?: string
  paidAt?: string
  dueDate?: string
  pdfUrl?: string
  createdAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(0) // 0 = all months
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2024 }, (_, i) => 2025 + i)
  const months = [
    { value: 0, label: 'Alle Monate' },
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'März' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Dezember' }
  ]

  const statuses = [
    { value: 'all', label: 'Alle Status' },
    { value: 'DRAFT', label: 'Entwurf' },
    { value: 'SENT', label: 'Versendet' },
    { value: 'PAID', label: 'Bezahlt' },
    { value: 'OVERDUE', label: 'Überfällig' },
    { value: 'CANCELLED', label: 'Storniert' }
  ]

  useEffect(() => {
    fetchInvoices()
  }, [selectedYear, selectedMonth, selectedStatus])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedMonth > 0 && { month: selectedMonth.toString() }),
        ...(selectedStatus !== 'all' && { status: selectedStatus })
      })

      const response = await fetch(`/api/admin/invoices?${params}`)
      if (response.ok) {
        const result = await response.json()
        setInvoices(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500'
    }
    const labels = {
      DRAFT: 'Entwurf',
      SENT: 'Versendet',
      PAID: 'Bezahlt',
      OVERDUE: 'Überfällig',
      CANCELLED: 'Storniert'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const totalRevenue = invoices
    .filter(inv => ['SENT', 'PAID'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  const paidRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  const outstandingRevenue = totalRevenue - paidRevenue

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Provisionsrechnungen</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/invoices/settings">
            <Button variant="outline">
              ⚙️ Einstellungen
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Gesamt ({selectedYear})</div>
          <div className="text-2xl font-bold">{invoices.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Gesamtumsatz</div>
          <div className="text-2xl font-bold text-blue-600">{formatEUR(totalRevenue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Bezahlt</div>
          <div className="text-2xl font-bold text-green-600">{formatEUR(paidRevenue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Ausstehend</div>
          <div className="text-2xl font-bold text-orange-600">{formatEUR(outstandingRevenue)}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
          >
            <Filter className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="text-lg">Lade Rechnungen...</div>
        </Card>
      ) : invoices.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Rechnungen gefunden</h3>
          <p className="text-gray-600">
            Für den ausgewählten Zeitraum und Filter existieren keine Rechnungen.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rechnungsnr.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Werkstatt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zeitraum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Fällig am
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/admin/invoices/${invoice.id}`}
                        className="font-mono text-sm text-blue-600 hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{invoice.workshop.name}</div>
                      {invoice.workshop.email && (
                        <div className="text-xs text-gray-500">{invoice.workshop.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-semibold">
                      {formatEUR(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Aktionen
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/invoices/${invoice.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details anzeigen
                            </Link>
                          </DropdownMenuItem>
                          {invoice.pdfUrl && (
                            <DropdownMenuItem asChild>
                              <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                PDF herunterladen
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
