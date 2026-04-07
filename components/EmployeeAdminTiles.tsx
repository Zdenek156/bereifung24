'use client'

import { useEffect, useState, useMemo } from 'react'
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

// Category display config: label, icon, sort priority
const CATEGORY_CONFIG: Record<string, { label: string; icon: string; order: number }> = {
  'GENERAL':      { label: 'Allgemein & System',       icon: 'LayoutGrid',    order: 1 },
  'SALES':        { label: 'Vertrieb & Marketing',     icon: 'TrendingUp',    order: 2 },
  'ACCOUNTING':   { label: 'Buchhaltung & Finanzen',   icon: 'Calculator',    order: 3 },
  'HR':           { label: 'Personal',                 icon: 'Users',         order: 4 },
  'SUPPORT':      { label: 'Kommunikation & Support',  icon: 'MessageSquare', order: 5 },
  'PLANUNG':      { label: 'Planung & Strategie',      icon: 'Map',           order: 6 },
  'CONTENT':      { label: 'Content & Medien',         icon: 'FileText',      order: 7 },
  'ADMIN':        { label: 'Administration',           icon: 'Settings',      order: 8 },
  'SYSTEM':       { label: 'System & Technik',         icon: 'Server',        order: 9 },
  'DATENSCHUTZ':  { label: 'Datenschutz & Compliance', icon: 'Shield',        order: 10 },
}

function getCategoryConfig(cat: string) {
  const key = cat.toUpperCase()
  return CATEGORY_CONFIG[key] || { label: cat, icon: 'Folder', order: 99 }
}

export default function EmployeeAdminTiles() {
  const { data: session } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([])

  useEffect(() => {
    fetchApplications()
  }, [])

  // Load favorites + collapsed state from localStorage
  useEffect(() => {
    if (!session?.user?.email) return
    const favKey = `emp_favorites_${session.user.email}`
    const colKey = `emp_collapsed_${session.user.email}`
    const savedFav = localStorage.getItem(favKey)
    const savedCol = localStorage.getItem(colKey)
    if (savedFav) {
      try { setFavorites(JSON.parse(savedFav)) } catch {}
    }
    if (savedCol) {
      try { setCollapsedCategories(JSON.parse(savedCol)) } catch {}
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

  const toggleCategory = (cat: string) => {
    const key = `emp_collapsed_${session?.user?.email}`
    setCollapsedCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  const fetchApplications = async () => {
    try {
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

  const getSmallIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Icons.Settings className="w-4 h-4" />
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
      gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' }
    }
    return colors[color] || colors.gray
  }

  // Filter apps by search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return applications
    const q = searchQuery.toLowerCase()
    return applications.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      a.key.toLowerCase().includes(q) ||
      getCategoryConfig(a.category).label.toLowerCase().includes(q)
    )
  }, [applications, searchQuery])

  // Group unpinned apps by category
  const groupedApps = useMemo(() => {
    const unpinned = filteredApps.filter(a => !favorites.includes(a.id))
    const groups: Record<string, Application[]> = {}
    for (const app of unpinned) {
      const catKey = app.category.toUpperCase()
      if (!groups[catKey]) groups[catKey] = []
      groups[catKey].push(app)
    }
    // Sort groups by configured order
    return Object.entries(groups)
      .sort(([a], [b]) => getCategoryConfig(a).order - getCategoryConfig(b).order)
      .map(([catKey, apps]) => ({
        key: catKey,
        config: getCategoryConfig(catKey),
        apps: apps.sort((a, b) => a.sortOrder - b.sortOrder)
      }))
  }, [filteredApps, favorites])

  const pinnedApps = useMemo(() =>
    filteredApps.filter(a => favorites.includes(a.id)),
    [filteredApps, favorites]
  )

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

  const handleNavigation = (adminRoute: string) => {
    let href = adminRoute
    if (session?.user?.role === 'B24_EMPLOYEE') {
      href = href.replace('/admin/', '/mitarbeiter/')
      if (href.startsWith('/sales')) {
        href = '/mitarbeiter/sales'
      }
    }
    router.push(href)
  }

  const AppCard = ({ app, compact = false }: { app: Application; compact?: boolean }) => {
    const colors = getColorClasses(app.color)
    const isFav = favorites.includes(app.id)
    return (
      <div className={`relative group ${compact ? '' : 'h-full'}`}>
        <button
          onClick={() => handleNavigation(app.adminRoute)}
          className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left w-full ${compact ? 'p-3 h-24 flex flex-col' : 'p-5 flex flex-col overflow-hidden'}`}
        >
          <div className={`flex items-center justify-center flex-shrink-0 ${compact ? 'w-8 h-8 mb-2' : 'w-10 h-10 mb-3'} ${colors.bg} rounded-lg`}>
            <span className={`${colors.text} ${compact ? '[&>svg]:w-4 [&>svg]:h-4' : '[&>svg]:w-5 [&>svg]:h-5'}`}>{getIcon(app.icon)}</span>
          </div>
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-xs leading-tight line-clamp-2' : 'text-base mb-1 line-clamp-1'}`}>{app.name}</h3>
          {!compact && <p className="text-sm text-gray-500 line-clamp-2 leading-snug">{app.description}</p>}
        </button>
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
      {/* Search bar */}
      <div className="relative mb-6">
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Anwendung suchen..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* No results */}
      {filteredApps.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          <Icons.SearchX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Keine Anwendung gefunden für &quot;{searchQuery}&quot;</p>
        </div>
      )}

      {/* Favorites strip */}
      {pinnedApps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Favoriten</span>
            <span className="text-xs text-gray-400 ml-1">({pinnedApps.length})</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {pinnedApps.map(app => (
              <div key={app.id} className="w-32">
                <AppCard app={app} compact />
              </div>
            ))}
          </div>
          {groupedApps.length > 0 && <div className="border-t border-gray-100 mt-5 mb-2" />}
        </div>
      )}

      {/* Category groups */}
      {groupedApps.map(({ key: catKey, config, apps }) => {
        const isCollapsed = collapsedCategories.includes(catKey)
        return (
          <div key={catKey} className="mb-4">
            <button
              onClick={() => toggleCategory(catKey)}
              className="flex items-center gap-2 w-full text-left py-2 px-1 rounded-md hover:bg-gray-50 transition-colors group/cat"
            >
              <Icons.ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
              />
              <span className="text-gray-500">{getSmallIcon(config.icon)}</span>
              <span className="text-sm font-semibold text-gray-700">{config.label}</span>
              <span className="text-xs text-gray-400">({apps.length})</span>
            </button>

            {!isCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2 ml-1">
                {apps.map(app => (
                  <div key={app.id}>
                    <AppCard app={app} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {groupedApps.length === 0 && pinnedApps.length > 0 && !searchQuery && (
        <p className="text-sm text-gray-400 text-center py-2">Alle Anwendungen sind als Favorit gespeichert</p>
      )}
    </div>
  )
}
