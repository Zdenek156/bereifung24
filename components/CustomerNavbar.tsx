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
  ChevronDown
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
    { id: 'home', label: 'Startseite', icon: Home, path: '/dashboard/customer' },
    { id: 'new-request', label: 'Neue Anfrage', icon: Plus, path: '/dashboard/customer/select-service' },
    { id: 'requests', label: 'Meine Anfragen', icon: ClipboardList, path: '/dashboard/customer/requests' },
    { id: 'appointments', label: 'Termine', icon: Calendar, path: '/dashboard/customer/appointments' },
    { id: 'bookings', label: 'Buchungen', icon: BookOpen, path: '/dashboard/customer/bookings' },
    { id: 'vehicles', label: 'Fahrzeuge', icon: Car, path: '/dashboard/customer/vehicles' },
    { id: 'tire-history', label: 'Reifenhistorie', icon: Clock, path: '/dashboard/customer/tire-history' },
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
      // Step 1: Delete cookies via server endpoint
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Step 2: Call NextAuth signout
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'callbackUrl=/login',
        credentials: 'include'
      })
      
      // Step 3: Clear storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Step 4: Redirect
      window.location.href = '/login'
    } catch (error) {
      console.error('[LOGOUT] Error:', error)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl">🔧</div>
            <span className="text-xl font-bold text-gray-900">Bereifung24</span>
          </div>

          {/* Profile Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials()}
              </div>
              
              {/* Name & Icon - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-medium text-gray-700">{session?.user?.name || 'Benutzer'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{session?.user?.name}</div>
                      <div className="text-sm text-gray-500 truncate">{session?.user?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="py-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    return (
                      <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${active 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <button
                    onClick={() => router.push('/dashboard/customer/settings')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Einstellungen</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Abmelden</span>
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
