'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Check, X, Clock, Filter, Calendar } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useRouter, useSearchParams } from 'next/navigation'

interface Payroll {
  id: string
  month: number
  year: number
  status: 'DRAFT' | 'APPROVED' | 'PAID'
  totalGross: number
  totalNet: number
  totalEmployer: number
  employeeCount: number
  approvedBy: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
}

export default function GehaltsabrechnungenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')

  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || 'ALL')
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    fetchPayrolls()
  }, [selectedStatus, selectedYear])

  const fetchPayrolls = async () => {
    try {
      let url = `/api/admin/hr/payrolls?year=${selectedYear}`
      if (selectedStatus !== 'ALL') {
        url += `&status=${selectedStatus}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPayrolls(data)
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatMonth = (month: number) => {
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ]
    return months[month - 1]
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      PAID: 'bg-blue-100 text-blue-800 border-blue-300'
    }
    const labels = {
      DRAFT: 'Entwurf',
      APPROVED: 'Freigegeben',
      PAID: 'Bezahlt'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Möchten Sie diese Gehaltsabrechnung wirklich freigeben?')) return
    
    try {
      const response = await fetch(`/api/admin/hr/payrolls/${id}/approve`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchPayrolls()
      }
    } catch (error) {
      console.error('Error approving payroll:', error)
      alert('Fehler beim Freigeben der Abrechnung')
    }
  }

  const handleMarkPaid = async (id: string) => {
    if (!confirm('Möchten Sie diese Gehaltsabrechnung als bezahlt markieren?')) return
    
    try {
      const response = await fetch(`/api/admin/hr/payrolls/${id}/mark-paid`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchPayrolls()
      }
    } catch (error) {
      console.error('Error marking payroll as paid:', error)
      alert('Fehler beim Markieren als bezahlt')
    }
  }

  const handleExport = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/hr/payrolls/${id}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gehaltsabrechnung_${id}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting payroll:', error)
      alert('Fehler beim Exportieren')
    }
  }

  // Generate years array (2025 to current year)
  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: currentYear - 2025 + 1 },
    (_, i) => 2025 + i
  ).reverse()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Gehaltsabrechnungen...</div>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard applicationKey="hr">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Gehaltsabrechnungen</h1>
              <p className="text-gray-600 mt-1">Monatsabrechnungen verwalten & exportieren</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin/hr/gehaltsabrechnungen/generieren')}
            className="bg-green-600 hover:bg-green-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Neue Abrechnung
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="ALL">Alle Status</option>
                <option value="DRAFT">Entwürfe</option>
                <option value="APPROVED">Freigegeben</option>
                <option value="PAID">Bezahlt</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              {payrolls.length} {payrolls.length === 1 ? 'Abrechnung' : 'Abrechnungen'}
            </div>
          </div>
        </Card>

        {/* Payrolls List */}
        {payrolls.length > 0 ? (
          <div className="space-y-4">
            {payrolls.map(payroll => (
              <Card key={payroll.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">
                        {formatMonth(payroll.month)} {payroll.year}
                      </h3>
                      {getStatusBadge(payroll.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Mitarbeiter</p>
                        <p className="text-lg font-semibold">{payroll.employeeCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Brutto gesamt</p>
                        <p className="text-lg font-semibold">{formatEUR(payroll.totalGross)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Netto gesamt</p>
                        <p className="text-lg font-semibold">{formatEUR(payroll.totalNet)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">AG-Anteile</p>
                        <p className="text-lg font-semibold">{formatEUR(payroll.totalEmployer)}</p>
                      </div>
                    </div>

                    {payroll.approvedAt && (
                      <div className="mt-3 text-sm text-gray-600">
                        Freigegeben am {new Date(payroll.approvedAt).toLocaleDateString('de-DE')}
                      </div>
                    )}
                    {payroll.paidAt && (
                      <div className="text-sm text-gray-600">
                        Bezahlt am {new Date(payroll.paidAt).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => router.push(`/admin/hr/gehaltsabrechnungen/${payroll.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      Details
                    </Button>

                    {payroll.status === 'DRAFT' && (
                      <Button
                        onClick={() => handleApprove(payroll.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Freigeben
                      </Button>
                    )}

                    {payroll.status === 'APPROVED' && (
                      <Button
                        onClick={() => handleMarkPaid(payroll.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Als bezahlt markieren
                      </Button>
                    )}

                    <Button
                      onClick={() => handleExport(payroll.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-2xl font-bold">
                Keine Gehaltsabrechnungen für {selectedYear}
              </h2>
              <p className="text-gray-600">
                {selectedStatus !== 'ALL' 
                  ? `Es gibt keine Abrechnungen mit Status "${selectedStatus}".`
                  : 'Für das ausgewählte Jahr sind noch keine Gehaltsabrechnungen vorhanden.'
                }
              </p>
              <Button
                onClick={() => router.push('/admin/hr/gehaltsabrechnungen/generieren')}
                className="mt-4"
              >
                Erste Abrechnung erstellen
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  )
}
