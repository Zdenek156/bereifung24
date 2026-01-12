'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, UserPlus, FileText, Calendar, Settings, TrendingUp } from 'lucide-react'

interface HRStats {
  totalEmployees: number
  activeEmployees: number
  pendingLeave: number
  upcomingSickLeave: number
}

export default function MitarbeiterHRPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<HRStats | null>(null)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/employee/has-application?key=hr')
      const result = await response.json()
      
      if (result.hasAccess) {
        setHasAccess(true)
        await fetchStats()
      } else {
        router.push('/mitarbeiter')
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/mitarbeiter')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/hr/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching HR stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade HR-Bereich...</div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  const menuItems = [
    {
      title: 'Mitarbeiter',
      description: 'Mitarbeiterverwaltung',
      href: '/admin/hr/mitarbeiter',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Neuer Mitarbeiter',
      description: 'Mitarbeiter anlegen',
      href: '/admin/hr/mitarbeiter/neu',
      icon: <UserPlus className="h-8 w-8" />,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Dokumente',
      description: 'Mitarbeiterdokumente',
      href: '/admin/hr/mitarbeiter',
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Urlaubsverwaltung',
      description: 'Urlaubs- und Abwesenheiten',
      href: '/admin/hr/mitarbeiter',
      icon: <Calendar className="h-8 w-8" />,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Berechtigungen',
      description: 'Application-Zuweisungen',
      href: '/admin/hr/applications-assignment',
      icon: <Settings className="h-8 w-8" />,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Statistiken',
      description: 'HR-Kennzahlen',
      href: '/admin/hr',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-pink-50 text-pink-600'
    }
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/mitarbeiter')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <h1 className="text-3xl font-bold">Human Resources</h1>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mitarbeiter gesamt</p>
                <p className="text-2xl font-bold mt-1">{stats.totalEmployees}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktive Mitarbeiter</p>
                <p className="text-2xl font-bold mt-1">{stats.activeEmployees}</p>
              </div>
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offene Urlaubsanträge</p>
                <p className="text-2xl font-bold mt-1">{stats.pendingLeave}</p>
              </div>
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Krankmeldungen</p>
                <p className="text-2xl font-bold mt-1">{stats.upcomingSickLeave}</p>
              </div>
              <FileText className="h-6 w-6 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <Card
            key={index}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(item.href)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
