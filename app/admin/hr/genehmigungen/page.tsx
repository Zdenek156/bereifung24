'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Euro } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'

interface PendingApproval {
  id: string
  type: 'PAYROLL' | 'EXPENSE' | 'LEAVE'
  title: string
  employeeName: string
  amount?: number
  month?: number
  year?: number
  status: string
  createdAt: string
}

export default function PendingApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = async () => {
    setLoading(true)
    try {
      // Fetch pending payrolls
      const payrollsResponse = await fetch('/api/admin/hr/payrolls?status=DRAFT')
      if (payrollsResponse.ok) {
        const payrolls = await payrollsResponse.json()
        const pendingPayrolls: PendingApproval[] = payrolls.map((p: any) => ({
          id: p.id,
          type: 'PAYROLL' as const,
          title: `Gehaltsabrechnung ${getMonthName(p.month)} ${p.year}`,
          employeeName: `${p.employeeCount} Mitarbeiter`,
          amount: p.totalGross,
          month: p.month,
          year: p.year,
          status: p.status,
          createdAt: p.createdAt
        }))
        setApprovals(pendingPayrolls)
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approval: PendingApproval) => {
    if (!confirm(`Möchten Sie "${approval.title}" wirklich freigeben?`)) return

    try {
      const response = await fetch(`/api/admin/hr/payrolls/${approval.id}/approve`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchPendingApprovals()
      }
    } catch (error) {
      console.error('Error approving:', error)
    }
  }

  const handleReject = async (approval: PendingApproval) => {
    if (!confirm(`Möchten Sie "${approval.title}" wirklich ablehnen?`)) return
    
    alert('Ablehnungsfunktion noch nicht implementiert')
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYROLL':
        return <Euro className="h-5 w-5" />
      case 'EXPENSE':
        return <Euro className="h-5 w-5" />
      case 'LEAVE':
        return <Clock className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYROLL':
        return 'Gehaltsabrechnung'
      case 'EXPENSE':
        return 'Spesenabrechnung'
      case 'LEAVE':
        return 'Urlaubsantrag'
      default:
        return type
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">Ausstehende Genehmigungen</h1>
          <p className="text-gray-600">Offene Anträge und Freigaben</p>
        </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Lade Genehmigungen...</div>
          </div>
        ) : approvals.length > 0 ? (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <Card key={approval.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      {getTypeIcon(approval.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{approval.title}</h3>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {getTypeLabel(approval.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{approval.employeeName}</p>
                      {approval.amount && (
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {formatEUR(approval.amount)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Erstellt: {new Date(approval.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(approval)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Freigeben
                    </Button>
                    <Button
                      onClick={() => handleReject(approval)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ablehnen
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Keine ausstehenden Genehmigungen</h2>
            <p className="text-gray-600">Alle Anträge und Abrechnungen sind genehmigt.</p>
          </Card>
        )}
      </div>
  )
}
