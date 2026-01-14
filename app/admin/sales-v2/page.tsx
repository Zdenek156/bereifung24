'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Target, Search, Users, TrendingUp, MapPin, Phone, Mail, Star } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalProspects: number
  newThisWeek: number
  contacted: number
  converted: number
}

export default function SalesDashboardV2() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalProspects: 0,
    newThisWeek: 0,
    contacted: 0,
    converted: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user) {
      router.push('/login')
      return
    }
    
    // Check if user has Sales CRM application (ID 10)
    checkPermission()
  }, [status, session, router])

  const checkPermission = async () => {
    try {
      const response = await fetch('/api/admin/hr/check-application?applicationId=10')
      if (!response.ok) {
        router.push('/mitarbeiter')
        return
      }
      fetchStats()
    } catch (error) {
      console.error('Permission check failed:', error)
      router.push('/mitarbeiter')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sales/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.summary || stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Sales Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sales CRM</h1>
                <p className="text-sm text-gray-600">Werkstatt-Akquise & Lead-Management</p>
              </div>
            </div>
            <Link
              href="/admin/sales-v2/search"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Search className="h-5 w-5 mr-2" />
              Neue Werkstätten suchen
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Prospects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProspects}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Neu diese Woche</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.newThisWeek}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kontaktiert</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.contacted}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Konvertiert</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.converted}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/sales-v2/search"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Werkstätten suchen</h3>
                <p className="text-sm text-gray-600">Google Places Integration</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/sales-v2/prospects"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Meine Prospects</h3>
                <p className="text-sm text-gray-600">Verwalte deine Leads</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/sales-v2/map"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Karten-Ansicht</h3>
                <p className="text-sm text-gray-600">Geografische Übersicht</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
