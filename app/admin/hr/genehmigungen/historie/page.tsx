'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Euro, Calendar, User } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'

interface ApprovalHistory {
  id: string
  type: 'PAYROLL' | 'EXPENSE' | 'LEAVE'
  title: string
  employeeName: string
  amount?: number
  status: 'APPROVED' | 'REJECTED'
  approvedBy: string
  approvedAt: string
}

export default function ApprovalHistoryPage() {
  const [history, setHistory] = useState<ApprovalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      // Fetch approved and paid payrolls
      const payrollsResponse = await fetch('/api/admin/hr/payrolls')
      if (payrollsResponse.ok) {
        const payrolls = await payrollsResponse.json()
        const approvedPayrolls: ApprovalHistory[] = payrolls
          .filter((p: any) => p.status === 'APPROVED' || p.status === 'PAID')
          .map((p: any) => ({
            id: p.id,
            type: 'PAYROLL' as const,
            title: `Gehaltsabrechnung ${getMonthName(p.month)} ${p.year}`,
            employeeName: `${p.employeeCount} Mitarbeiter`,
            amount: p.totalGross,
            status: 'APPROVED' as const,
            approvedBy: p.approvedBy || 'System',
            approvedAt: p.approvedAt || p.createdAt
          }))
        setHistory(approvedPayrolls)
      }
    } catch (error) {
      console.error('Error fetching approval history:', error)
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

  const getMonthName = (month: number) => {
    const names = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    return names[month - 1] || `Monat ${month}`
  }

  const filteredHistory = history.filter(h => 
    filterStatus === 'ALL' || h.status === filterStatus
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Genehmigungs-Historie</h1>
              <p className="text-gray-600">Alle freigegebenen und abgelehnten Anträge</p>
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="ALL">Alle</option>
            <option value="APPROVED">Genehmigt</option>
            <option value="REJECTED">Abgelehnt</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Lade Historie...</div>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-lg ${item.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {item.status === 'APPROVED' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{item.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'APPROVED' ? 'Genehmigt' : 'Abgelehnt'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.employeeName}
                      </p>
                      {item.amount && (
                        <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {formatEUR(item.amount)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Genehmigt von: {item.approvedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.approvedAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">Keine Historie vorhanden</h2>
            <p className="text-gray-600">
              {filterStatus === 'ALL' 
                ? 'Es wurden noch keine Genehmigungen durchgeführt.'
                : `Es wurden noch keine ${filterStatus === 'APPROVED' ? 'genehmigten' : 'abgelehnten'} Anträge gefunden.`
              }
            </p>
          </Card>
        )}
      </div>
  )
}
