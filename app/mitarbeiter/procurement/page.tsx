'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, Package, TrendingUp, DollarSign, Users, Settings } from 'lucide-react'

export default function MitarbeiterProcurementPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/employee/has-application?key=procurement')
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
          <div className="text-lg">Lade Einkauf...</div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  const menuItems = [
    {
      title: 'Bestellanfragen',
      description: 'Neue Anfragen erstellen und verwalten',
      href: '/admin/procurement/requests',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Bestellungen',
      description: 'Aktive und abgeschlossene Bestellungen',
      href: '/admin/procurement/orders',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Anlagenverwaltung',
      description: 'Vermögensgegenstände verwalten',
      href: '/admin/procurement/assets',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Budget',
      description: 'Budgetplanung und -überwachung',
      href: '/admin/procurement/budget',
      icon: <DollarSign className="h-8 w-8" />,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Lieferanten',
      description: 'Lieferantenverwaltung',
      href: '/admin/procurement/suppliers',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Einstellungen',
      description: 'Einkaufseinstellungen',
      href: '/admin/procurement',
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
        <h1 className="text-3xl font-bold">Einkauf & Beschaffung</h1>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Verwaltung von Bestellungen, Lieferanten und Anlagen
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-blue-50 border-blue-200"
          onClick={() => router.push('/admin/procurement/requests/new')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-lg">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Neue Bestellanfrage</h3>
              <p className="text-sm text-gray-600">Bestellung direkt erstellen</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-green-50 border-green-200"
          onClick={() => router.push('/admin/procurement/assets')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600 text-white rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Anlagen verwalten</h3>
              <p className="text-sm text-gray-600">Vermögensgegenstände einsehen</p>
            </div>
          </div>
        </Card>
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
