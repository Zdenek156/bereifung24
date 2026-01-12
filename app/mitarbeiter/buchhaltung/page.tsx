'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, TrendingUp, Calculator, Settings, BookOpen, FileBarChart } from 'lucide-react'

interface QuickStat {
  label: string
  value: string | number
  icon: React.ReactNode
  href: string
}

export default function MitarbeiterBuchhaltungPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<QuickStat[]>([])

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/employee/has-application?key=buchhaltung')
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
      const response = await fetch('/api/admin/accounting/stats')
      if (response.ok) {
        const data = await response.json()
        
        setStats([
          {
            label: 'Offene Buchungen',
            value: data.pendingEntries || 0,
            icon: <FileText className="h-6 w-6" />,
            href: '/admin/buchhaltung/journal'
          },
          {
            label: 'Aktuelles Jahr',
            value: new Date().getFullYear(),
            icon: <Calculator className="h-6 w-6" />,
            href: '/admin/buchhaltung/bilanz'
          },
          {
            label: 'Buchungen (Monat)',
            value: data.monthlyEntries || 0,
            icon: <TrendingUp className="h-6 w-6" />,
            href: '/admin/buchhaltung/journal'
          },
          {
            label: 'Anlagen',
            value: data.totalAssets || 0,
            icon: <BookOpen className="h-6 w-6" />,
            href: '/admin/buchhaltung/anlagen'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Buchhaltung...</div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  const menuItems = [
    {
      title: 'Journal',
      description: 'Buchungsjournal ansehen',
      href: '/admin/buchhaltung/journal',
      icon: <FileText className="h-8 w-8" />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Bilanz',
      description: 'Bilanz und Jahresabschluss',
      href: '/admin/buchhaltung/bilanz',
      icon: <FileBarChart className="h-8 w-8" />,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'GuV',
      description: 'Gewinn- und Verlustrechnung',
      href: '/admin/buchhaltung/guv',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Anlagen',
      description: 'Anlagenverwaltung',
      href: '/admin/buchhaltung/anlagen',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Kontenplan',
      description: 'SKR04 Kontenplan',
      href: '/admin/buchhaltung/kontenplan',
      icon: <Calculator className="h-8 w-8" />,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Einstellungen',
      description: 'Buchhaltungseinstellungen',
      href: '/admin/buchhaltung/einstellungen',
      icon: <Settings className="h-8 w-8" />,
      color: 'bg-gray-50 text-gray-600'
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
        <h1 className="text-3xl font-bold">Buchhaltung</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(stat.href)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="text-blue-600">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

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
