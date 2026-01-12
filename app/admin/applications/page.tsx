'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Users } from 'lucide-react'
import * as Icons from 'lucide-react'

interface Application {
  id: string
  key: string
  name: string
  description?: string
  icon: string
  adminRoute: string
  color: string
  sortOrder: number
  isActive: boolean
  category: string
  createdAt: string
  updatedAt: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications')
      if (response.ok) {
        const result = await response.json()
        setApplications(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      GENERAL: 'Allgemein',
      ACCOUNTING: 'Buchhaltung',
      HR: 'Personal',
      SALES: 'Vertrieb',
      SUPPORT: 'Support'
    }
    return labels[category] || category
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700'
    }
    return colors[color] || colors.gray
  }

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Settings className="h-5 w-5" />
  }

  const groupedApps = applications.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = []
    }
    acc[app.category].push(app)
    return acc
  }, {} as Record<string, Application[]>)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Anwendungen...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Anwendungsverwaltung</h1>
          <p className="text-gray-600 mt-1">
            Verwalte alle verfügbaren Anwendungen im System
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => window.location.href = '/admin/hr/applications-assignment'}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Zuweisungen verwalten
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedApps).map(([category, apps]) => (
          <div key={category}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {getCategoryLabel(category)}
              <span className="text-sm font-normal text-gray-500">
                ({apps.length} Anwendungen)
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <Card
                  key={app.id}
                  className={`p-4 border-2 ${getColorClasses(app.color)} ${
                    !app.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getIcon(app.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {app.name}
                            {!app.isActive && (
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                (Inaktiv)
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {app.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-mono bg-white px-2 py-1 rounded">
                            {app.key}
                          </span>
                          <span>Sortierung: {app.sortOrder}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Route: <code className="bg-white px-1 py-0.5 rounded">{app.adminRoute}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold">Keine Anwendungen gefunden</h2>
            <p className="text-gray-600">
              Es sind noch keine Anwendungen im System vorhanden.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
