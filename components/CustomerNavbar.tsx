'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { 
  User, 
  Settings, 
  LogOut,
  Home,
  Plus,
  ClipboardList,
  Calendar,
  BookOpen,
  Car,
  Clock,
  Cloud,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

export default function CustomerNavbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Startseite', icon: Home, path: '/' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/customer' },
    { id: 'new-request', label: 'Neue Anfrage', icon: Plus, path: '/dashboard/customer/select-service' },
    { id: 'requests', label: 'Meine Anfragen', icon: ClipboardList, path: '/dashboard/customer/requests' },
    { id: 'appointments', label: 'Termine', icon: Calendar, path: '/dashboard/customer/appointments' },
    { id: 'bookings', label: 'Buchungen', icon: BookOpen, path: '/dashboard/customer/bookings' },
    { id: 'vehicles', label: 'Fahrzeuge', icon: Car, path: '/dashboard/customer/vehicles' },
    { id: 'weather-alert', label: 'Wetter-Erinnerung', icon: Cloud, path: '/dashboard/customer/weather-alert' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Close dropdown when route changes
  useEffect(() => {
    setIsDropdownOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      // Step 1: Call NextAuth signout first
      await signOut({ redirect: false })
      
      // Step 2: Force delete cookies via server endpoint
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Step 3: Clear storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Step 4: Redirect
      window.location.href = '/'
    } catch (error) {
      console.error('[LOGOUT] Error:', error)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  const getUserInitials = () => {
    if (!session?.user?.name) return 'U'
    const names = session.user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return session.user.name.substring(0, 2).toUpperCase()
  }

  const isActive = (path: string) => {
    if (path === '/dashboard/customer') {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  return (
    <nav className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-primary-600 text-xl shadow-md">
              B24
            </div>
            <span className="text-xl font-bold text-white">Bereifung24</span>
          </div>

          {/* Profile Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">{session?.user?.name || 'Mein Konto'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>

                {/* Navigation Items */}
                <div className="py-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-gray-200 mt-2">
                  <button
                    onClick={() => router.push('/dashboard/customer/settings')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Einstellungen</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Abmelden</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
