'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  category: string
}

export default function EmployeeAdminTiles() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      // Get employee's assigned applications
      const response = await fetch('/api/employee/applications')
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

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="w-6 h-6" /> : <Icons.Settings className="w-6 h-6" />
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      red: { bg: 'bg-red-100', text: 'text-red-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' }
    }
    return colors[color] || colors.gray
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-5 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              Keine Anwendungen verfügbar
            </h3>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                Ihnen wurden noch keine Anwendungen zugewiesen. 
                Wenden Sie sich an Ihren Administrator, wenn Sie Zugriff auf bestimmte Bereiche benötigen.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Whitelist of applications that have mitarbeiter routes
  const mitarbeiterRoutesMap: Record<string, string> = {
    'customers': '/mitarbeiter/customers',
    'workshops': '/mitarbeiter/workshops',
    'hr': '/mitarbeiter/hr',
    'analytics': '/mitarbeiter/analytics',
    'buchhaltung': '/mitarbeiter/buchhaltung',
    'files': '/mitarbeiter/files',
    'affiliates': '/mitarbeiter/affiliates',
    'sales': '/mitarbeiter/sales',
    'recruitment': '/mitarbeiter/recruitment',
    'payroll': '/mitarbeiter/payroll',
    'fleet': '/mitarbeiter/fleet',
    'knowledge': '/mitarbeiter/knowledge',
    'settings': '/mitarbeiter/settings',
    'email-templates': '/mitarbeiter/email-templates',
    // For apps without mitarbeiter routes, use admin route
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((app) => {
        const colors = getColorClasses(app.color)
        
        // Check if there's a specific mitarbeiter route for this app
        const href = mitarbeiterRoutesMap[app.key] || app.adminRoute
        
        return (
          <Link
            key={app.id}
            href={href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className={`flex items-center justify-center w-12 h-12 ${colors.bg} rounded-lg mb-4`}>
              <span className={colors.text}>{getIcon(app.icon)}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{app.name}</h3>
            <p className="text-sm text-gray-600">{app.description}</p>
          </Link>
        )
      })}
    </div>
  )
}
