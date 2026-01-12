'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, Users, DollarSign, ShoppingCart, BarChart3, PieChart } from 'lucide-react'

export default function MitarbeiterAnalyticsPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/employee/has-application?key=analytics')
      const result = await response.json()
      
      if (result.hasAccess) {
        setHasAccess(true)
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Analytics...</div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  const analyticsCards = [
    {
      title: 'Umsatzentwicklung',
      description: 'Umsatzstatistiken und Trends',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-green-50 text-green-600',
      href: '/admin/analytics'
    },
    {
      title: 'Kundenanalyse',
      description: 'Kundenstatistiken und Verhalten',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-blue-50 text-blue-600',
      href: '/admin/analytics'
    },
    {
      title: 'Werkstattanalyse',
      description: 'Werkstatt-Performance',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'bg-purple-50 text-purple-600',
      href: '/admin/analytics'
    },
    {
      title: 'Provisionsübersicht',
      description: 'Provisionsauswertung',
      icon: <DollarSign className="h-8 w-8" />,
      color: 'bg-orange-50 text-orange-600',
      href: '/admin/commissions'
    },
    {
      title: 'Angebotsstatistik',
      description: 'Angebots- und Konversionsraten',
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'bg-indigo-50 text-indigo-600',
      href: '/admin/analytics'
    },
    {
      title: 'Dienstleistungen',
      description: 'Service-Verteilung',
      icon: <PieChart className="h-8 w-8" />,
      color: 'bg-pink-50 text-pink-600',
      href: '/admin/analytics'
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
        <h1 className="text-3xl font-bold">Analytics & Statistiken</h1>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Detaillierte Auswertungen und Statistiken zur Geschäftsentwicklung
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsCards.map((card, index) => (
          <Card
            key={index}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(card.href)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Vollständige Analytics</h3>
            <p className="text-sm text-blue-800">
              Für detaillierte Auswertungen und Dashboards besuchen Sie den Admin-Bereich unter Analytics.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
