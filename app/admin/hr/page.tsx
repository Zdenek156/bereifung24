'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, CheckCircle, AlertCircle, Plus, TrendingUp, DollarSign, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HRStats {
  totalEmployees: number
  activeEmployees: number
  pendingApprovals: number
  pendingPayrolls: number
  monthlyPayrollTotal: number
  openJobPostings: number
}

export default function HRDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingApprovals: 0,
    pendingPayrolls: 0,
    monthlyPayrollTotal: 0,
    openJobPostings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/hr/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching HR stats:', error)
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade HR-Dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">HR Management</h1>
          <p className="text-gray-600 mt-1">Personal, Gehälter & Genehmigungen</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/admin/hr/mitarbeiter/neu')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Mitarbeiter
          </Button>
          <Button
            onClick={() => router.push('/admin/hr/gehaltsabrechnungen/generieren')}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gehälter generieren
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Mitarbeiter */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/hr/mitarbeiter')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mitarbeiter</p>
              <p className="text-3xl font-bold mt-1">{stats.activeEmployees}</p>
              <p className="text-xs text-gray-500 mt-1">von {stats.totalEmployees} gesamt</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Monatliche Lohnkosten */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/hr/gehaltsabrechnungen')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monatliche Lohnkosten</p>
              <p className="text-3xl font-bold mt-1">{formatEUR(stats.monthlyPayrollTotal)}</p>
              <p className="text-xs text-gray-500 mt-1">inkl. AG-Anteile</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Pendente Genehmigungen */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/hr/genehmigungen')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendente Genehmigungen</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingApprovals}</p>
              <p className="text-xs text-gray-500 mt-1">warten auf Freigabe</p>
            </div>
            <div className={`p-3 rounded-full ${stats.pendingApprovals > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <AlertCircle className={`h-8 w-8 ${stats.pendingApprovals > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </Card>

        {/* Offene Gehaltsentwürfe */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/hr/gehaltsabrechnungen?status=DRAFT')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gehalts-Entwürfe</p>
              <p className="text-3xl font-bold mt-1">{stats.pendingPayrolls}</p>
              <p className="text-xs text-gray-500 mt-1">noch nicht freigegeben</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Offene Stellenausschreibungen */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/hr/stellen')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offene Stellen</p>
              <p className="text-3xl font-bold mt-1">{stats.openJobPostings}</p>
              <p className="text-xs text-gray-500 mt-1">aktive Ausschreibungen</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </Card>

        {/* HR-Compliance */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">HR-Compliance</p>
              <p className="text-3xl font-bold mt-1 text-green-600">100%</p>
              <p className="text-xs text-gray-500 mt-1">alle Dokumente aktuell</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mitarbeiter-Management */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Mitarbeiter-Management</h2>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/admin/hr/mitarbeiter')}
              variant="outline"
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Mitarbeiter verwalten
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/mitarbeiter/neu')}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuen Mitarbeiter anlegen
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/ehemalige-mitarbeiter')}
              variant="outline"
              className="w-full justify-start"
            >
              <UserX className="h-4 w-4 mr-2" />
              Ehemalige Mitarbeiter
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/hierarchie')}
              variant="outline"
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Organigramm anzeigen
            </Button>
          </div>
        </Card>

        {/* Gehaltsabrechnung */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Gehaltsabrechnung</h2>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/admin/hr/gehaltsabrechnungen')}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Alle Gehaltsabrechnungen
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/gehaltsabrechnungen/generieren')}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Monatsabrechnung generieren
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/gehaltsabrechnungen/auswertungen')}
              variant="outline"
              className="w-full justify-start"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Lohnkosten-Auswertungen
            </Button>
          </div>
        </Card>

        {/* Recruiting */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recruiting</h2>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/admin/hr/stellen')}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Stellenausschreibungen
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/bewerbungen')}
              variant="outline"
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Bewerbungen verwalten
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/stellen/neu')}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Stelle ausschreiben
            </Button>
          </div>
        </Card>

        {/* Genehmigungen */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Genehmigungen</h2>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/admin/hr/genehmigungen')}
              variant="outline"
              className="w-full justify-start"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Pendente Genehmigungen ({stats.pendingApprovals})
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/genehmigungen/historie')}
              variant="outline"
              className="w-full justify-start"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Genehmigungs-Historie
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
