'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  const { data: session } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchApplications()
  }, [])

  // Load favorites from localStorage once session is known
  useEffect(() => {
    if (!session?.user?.email) return
    const key = `emp_favorites_${session.user.email}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try { setFavorites(JSON.parse(saved)) } catch {}
    }
  }, [session?.user?.email])

  const toggleFavorite = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation()
    const key = `emp_favorites_${session?.user?.email}`
    setFavorites(prev => {
      const next = prev.includes(appId) ? prev.filter(f => f !== appId) : [...prev, appId]
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

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

  // Mitarbeiter verwenden die gleichen optimierten Admin-Seiten
  // Alle Admin-Seiten erlauben bereits B24_EMPLOYEE Zugriff via requireAdminOrEmployee()

  const handleNavigation = (adminRoute: string) => {
    // Für B24_EMPLOYEE: URLs zeigen /mitarbeiter/* statt /admin/*
    // Next.js Rewrites mappen /mitarbeiter/* → /admin/* intern
    let href = adminRoute
    if (session?.user?.role === 'B24_EMPLOYEE') {
      href = href.replace('/admin/', '/mitarbeiter/')
      // Handle /sales route (not under /admin)
      if (href.startsWith('/sales')) {
        href = '/mitarbeiter/sales'
      }
    }
    
    // Use router.push with explicit prefetch to avoid white screen
    router.push(href)
  }

  const pinnedApps = applications.filter(a => favorites.includes(a.id))
  const unpinnedApps = applications.filter(a => !favorites.includes(a.id))

  const AppCard = ({ app, compact = false }: { app: Application; compact?: boolean }) => {
    const colors = getColorClasses(app.color)
    const isFav = favorites.includes(app.id)
    return (
      <div className="relative group">
        <button
          onClick={() => handleNavigation(app.adminRoute)}
          className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left w-full ${compact ? 'p-3 h-24 flex flex-col' : 'p-6'}`}
        >
          <div className={`flex items-center justify-center flex-shrink-0 ${compact ? 'w-8 h-8 mb-2' : 'w-12 h-12 mb-4'} ${colors.bg} rounded-lg`}>
            <span className={`${colors.text} ${compact ? '[&>svg]:w-4 [&>svg]:h-4' : ''}`}>{getIcon(app.icon)}</span>
          </div>
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-xs leading-tight line-clamp-2' : 'text-lg mb-2'}`}>{app.name}</h3>
          {!compact && <p className="text-sm text-gray-600">{app.description}</p>}
        </button>
        {/* Star button */}
        <button
          onClick={(e) => toggleFavorite(e, app.id)}
          title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
            isFav
              ? 'text-yellow-400 opacity-100'
              : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
          }`}
        >
          <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Favorites strip */}
      {pinnedApps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Favoriten</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {pinnedApps.map(app => (
              <div key={app.id} className="w-32">
                <AppCard app={app} compact />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-5 mb-5" />
        </div>
      )}

      {/* All apps grid */}
      {unpinnedApps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unpinnedApps.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      )}
      {unpinnedApps.length === 0 && pinnedApps.length > 0 && (
        <p className="text-sm text-gray-400 text-center py-2">Alle Anwendungen sind als Favorit gespeichert</p>
      )}
    </div>
  )
}
