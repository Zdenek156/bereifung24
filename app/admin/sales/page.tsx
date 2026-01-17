'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Users, Target, MapPin } from 'lucide-react'

interface Stats {
  totalProspects: number
  byStatus: { status: string; count: number }[]
  byCities: { city: string; count: number }[]
  conversionRate: number
  avgLeadScore: number
  activeTasks: number
  recentActivity: any[]
}

export default function SalesDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user) {
      router.push('/login')
      return
    }
    
    // Check if user has Sales CRM permission (Application ID 10)
    checkPermission()
  }, [status, session, router])

  const checkPermission = async () => {
    try {
      const response = await fetch('/api/admin/sales/check-permission')
      const data = await response.json()
      
      if (!response.ok || !data.hasPermission) {
        console.error('No permission for Sales CRM:', data)
        router.push('/admin')
        return
      }
      
      fetchStats()
    } catch (error) {
      console.error('Permission check error:', error)
      router.push('/admin')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sales/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales CRM</h1>
              <p className="mt-1 text-sm text-gray-600">
                Werkstatt-Akquise & Lead-Management
              </p>
            </div>
            <Link
              href="/mitarbeiter/sales/search"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Search className="h-5 w-5 mr-2" />
              Werkstätten suchen
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Gesamt Prospects"
            value={stats.totalProspects}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Lead Score (Ø)"
            value={stats.avgLeadScore.toFixed(1)}
            color="green"
          />
          <StatCard
            icon={<Target className="h-6 w-6" />}
            title="Offene Aufgaben"
            value={stats.activeTasks}
            color="purple"
          />
          <StatCard
            icon={<MapPin className="h-6 w-6" />}
            title="Conversion Rate"
            value={`${stats.conversionRate.toFixed(1)}%`}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              href="/mitarbeiter/sales/search"
              icon={<Search className="h-8 w-8" />}
              title="Werkstätten suchen"
              description="Google Places Integration mit Lead-Scoring"
              color="blue"
            />
            <ActionCard
              href="/mitarbeiter/sales/prospects"
              icon={<Users className="h-8 w-8" />}
              title="Alle Prospects"
              description="Übersicht und Verwaltung aller Leads"
              color="green"
            />
            <ActionCard
              href="/mitarbeiter/sales/reports"
              icon={<TrendingUp className="h-8 w-8" />}
              title="Reports & Analytics"
              description="Performance-Tracking und Auswertungen"
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

interface ActionCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  color: 'blue' | 'green' | 'purple'
}

function ActionCard({ href, icon, title, description, color }: ActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    green: 'bg-green-50 text-green-600 group-hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
  }

  return (
    <Link
      href={href}
      className="group block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  )
}
