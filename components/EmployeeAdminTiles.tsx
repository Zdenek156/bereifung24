'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface AdminNavigationItem {
  href: string
  title: string
  description: string
  icon: JSX.Element
  color: string
  textColor: string
  resource: string
}

const allAdminItems: AdminNavigationItem[] = [
  {
    href: '/admin/workshops',
    title: 'Werkstattverwaltung',
    description: 'Werkstätten freischalten und verwalten',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-600',
    resource: 'workshops',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    href: '/admin/customers',
    title: 'Kundenverwaltung',
    description: 'Kunden verwalten und analysieren',
    color: 'bg-blue-100',
    textColor: 'text-blue-600',
    resource: 'customers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    href: '/admin/email',
    title: 'E-Mail Versand',
    description: 'Newsletter und Updates versenden',
    color: 'bg-green-100',
    textColor: 'text-green-600',
    resource: 'email',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/admin/notifications',
    title: 'Benachrichtigungen',
    description: 'Email-Empfänger für Registrierungen',
    color: 'bg-orange-100',
    textColor: 'text-orange-600',
    resource: 'notifications',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  {
    href: '/admin/billing',
    title: 'Monatliche Abrechnung',
    description: 'Buchungsübersicht & GoCardless',
    color: 'bg-purple-100',
    textColor: 'text-purple-600',
    resource: 'billing',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    href: '/admin/commissions',
    title: 'Provisionen',
    description: 'Einzelne Zahlungen verwalten',
    color: 'bg-purple-100',
    textColor: 'text-purple-600',
    resource: 'commissions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    href: '/admin/influencer-management',
    title: 'Influencer Management',
    description: 'Affiliate-Links & Provisionen',
    color: 'bg-pink-100',
    textColor: 'text-pink-600',
    resource: 'influencers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    href: '/admin/territories',
    title: 'Gebietsübersicht',
    description: 'Karten & Marktanalyse',
    color: 'bg-teal-100',
    textColor: 'text-teal-600',
    resource: 'territories',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    )
  },
  {
    href: '/admin/cleanup',
    title: 'Datenbank Bereinigung',
    description: 'Testdaten selektiv löschen',
    color: 'bg-red-100',
    textColor: 'text-red-600',
    resource: 'cleanup',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  {
    href: '/admin/sepa-mandates',
    title: 'SEPA-Mandate',
    description: 'GoCardless Status prüfen',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    resource: 'sepa-mandates',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    href: '/admin/api-settings',
    title: 'API-Einstellungen',
    description: 'GoCardless, Google & API-Keys',
    color: 'bg-teal-100',
    textColor: 'text-teal-600',
    resource: 'api-settings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    )
  },
  {
    href: '/admin/procurement',
    title: 'Einkauf & Investitionen',
    description: 'Bedarfsanforderungen & AfA',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    resource: 'procurement',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    href: '/admin/email-settings',
    title: 'E-Mail Einstellungen',
    description: 'SMTP-Konfiguration',
    color: 'bg-purple-100',
    textColor: 'text-purple-600',
    resource: 'email-settings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/admin/email-templates',
    title: 'Email Templates',
    description: 'Email-Vorlagen verwalten',
    color: 'bg-pink-100',
    textColor: 'text-pink-600',
    resource: 'email-templates',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    )
  },
  {
    href: '/admin/b24-employees',
    title: 'Mitarbeiterverwaltung',
    description: 'B24 Mitarbeiter & Zugriffsrechte',
    color: 'bg-cyan-100',
    textColor: 'text-cyan-600',
    resource: 'b24-employees',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/admin/analytics',
    title: 'Analytics',
    description: 'Seitenaufrufe & Besucherstatistik',
    color: 'bg-blue-100',
    textColor: 'text-blue-600',
    resource: 'analytics',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    href: '/admin/server-info',
    title: 'Server-Übersicht',
    description: 'CPU, RAM & Performance-Metriken',
    color: 'bg-gray-100',
    textColor: 'text-gray-600',
    resource: 'server-info',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
  },
  {
    href: '/admin/security',
    title: 'Sicherheit & Account',
    description: 'Passwort, 2FA & Systemsicherheit',
    color: 'bg-red-100',
    textColor: 'text-red-600',
    resource: 'security',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  },
  {
    href: '/sales',
    title: 'Sales CRM',
    description: 'Werkstatt-Akquise mit Google Places',
    color: 'bg-green-100',
    textColor: 'text-green-600',
    resource: 'sales',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/admin/kvp',
    title: 'KVP',
    description: 'Kontinuierlicher Verbesserungsprozess',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    resource: 'kvp',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    href: '/admin/files',
    title: 'Dateiverwaltung',
    description: 'Dokumente und Dateien verwalten',
    color: 'bg-amber-100',
    textColor: 'text-amber-600',
    resource: 'files',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  },
  {
    href: '/admin/co2-tracking',
    title: 'CO₂-Tracking',
    description: 'Emissions-Faktoren konfigurieren',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    resource: 'co2-tracking',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  {
    href: '/admin/vehicles',
    title: 'Firmenfahrzeuge',
    description: 'Fahrzeugverwaltung & Fahrtenbuch',
    color: 'bg-cyan-100',
    textColor: 'text-cyan-600',
    resource: 'vehicles',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
]

export default function EmployeeAdminTiles() {
  const [visibleItems, setVisibleItems] = useState<AdminNavigationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccessibleResources()
  }, [])

  const fetchAccessibleResources = async () => {
    try {
      const response = await fetch('/api/admin/accessible-resources')
      if (response.ok) {
        const data = await response.json()
        const accessibleResources = new Set(data.accessibleResources)
        
        const filtered = allAdminItems.filter(item => 
          accessibleResources.has(item.resource)
        )
        
        setVisibleItems(filtered)
      }
    } catch (error) {
      console.error('Error fetching accessible resources:', error)
    } finally {
      setLoading(false)
    }
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

  if (visibleItems.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              Keine Admin-Bereiche verfügbar
            </h3>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                Sie haben derzeit keine Zugriffsrechte für Admin-Bereiche. 
                Wenden Sie sich an Ihren Administrator, wenn Sie Zugriff auf bestimmte Bereiche benötigen.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className={`flex items-center justify-center w-12 h-12 ${item.color} rounded-lg mb-4`}>
            <span className={item.textColor}>{item.icon}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
        </Link>
      ))}
    </div>
  )
}
