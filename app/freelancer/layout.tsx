'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

const SIDEBAR_ITEMS = [
  { href: '/freelancer', label: 'Übersicht', icon: '📊', exact: true },
  { href: '/freelancer/workshops', label: 'Meine Werkstätten', icon: '🔧' },
  { href: '/freelancer/leads', label: 'Lead-Pipeline', icon: '🎯' },
  { href: '/freelancer/earnings', label: 'Provisionen', icon: '💰' },
  { href: '/freelancer/billing', label: 'Abrechnung', icon: '📄' },
  { href: '/freelancer/materials', label: 'Materialien', icon: '📁' },
  { href: '/freelancer/profile', label: 'Mein Profil', icon: '👤' },
]

function FreelancerGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' || !session?.user) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'FREELANCER' && session.user.role !== 'ADMIN') {
      if (session.user.role === 'CUSTOMER') router.push('/dashboard/customer')
      else if (session.user.role === 'WORKSHOP') router.push('/dashboard/workshop')
      else router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Freelancer-Dashboard...</p>
        </div>
      </div>
    )
  }

  if (session?.user && (session.user.role === 'FREELANCER' || session.user.role === 'ADMIN')) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

function FreelancerSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`bg-gray-900 text-white ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-blue-400">Bereifung24</h2>
              <p className="text-xs text-gray-400">Freelancer-Dashboard</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-700 text-gray-400"
            title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 mx-2 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-200">{session?.user?.name}</p>
            <p className="text-xs text-gray-400">{session?.user?.email}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors`}
          title="Abmelden"
        >
          <span>🚪</span>
          {!collapsed && <span className="ml-2">Abmelden</span>}
        </button>
      </div>
    </aside>
  )
}

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <FreelancerGuard>
      <div className="flex min-h-screen bg-gray-50">
        <FreelancerSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </FreelancerGuard>
  )
}
