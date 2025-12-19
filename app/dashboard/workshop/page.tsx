'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'

export default function WorkshopDashboard() {
  const { data: session } = useSession()

  const sections = [
    {
      id: 'browse-requests',
      title: 'Anfragen durchsuchen',
      description: 'Finden Sie neue Kundenanfragen in Ihrer Nähe und erstellen Sie maßgeschneiderte Angebote.',
      details: 'Durchsuchen Sie aktuelle Anfragen für Reifenwechsel, Reparaturen, Bremsen, Klimaservice und mehr. Filtern Sie nach Standort, Service-Art und erstellen Sie individuelle Angebote direkt aus der Liste.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'primary',
      path: '/dashboard/workshop/browse-requests'
    },
    {
      id: 'offers',
      title: 'Meine Angebote',
      description: 'Verwalten Sie alle gesendeten Angebote und verfolgen Sie deren Status.',
      details: 'Sehen Sie welche Angebote ausstehend, akzeptiert oder abgelehnt wurden. Bearbeiten Sie Angebote oder ziehen Sie diese zurück. Erhalten Sie Benachrichtigungen wenn ein Kunde Ihr Angebot annimmt.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'green',
      path: '/dashboard/workshop/offers'
    },
    {
      id: 'appointments',
      title: 'Termine',
      description: 'Verwalten Sie alle bestätigten Kundentermine und Ihre Kalenderintegration.',
      details: 'Übersicht aller gebuchten Termine mit Google Calendar Synchronisation. Verwalten Sie Mitarbeiterkalender, blockieren Sie Zeiten und vermeiden Sie Doppelbuchungen automatisch.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'blue',
      path: '/dashboard/workshop/appointments'
    },
    {
      id: 'services',
      title: 'Service Verwaltung',
      description: 'Konfigurieren Sie Ihre angebotenen Dienstleistungen und Service-Pakete.',
      details: 'Definieren Sie welche Services Sie anbieten (Reifen, Bremsen, Klima, etc.), erstellen Sie Service-Pakete, setzen Sie Mindestpreise und verwalten Sie Zusatzoptionen wie Entsorgung oder Express-Service.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'purple',
      path: '/dashboard/workshop/services'
    },
    {
      id: 'pricing',
      title: 'Preiskalkulation',
      description: 'Verwalten Sie Ihre Preisgestaltung für verschiedene Services und Leistungen.',
      details: 'Legen Sie Basispreise fest, definieren Sie Aufschläge für Reifengrößen, Fahrzeugtypen oder zusätzliche Services. Konfigurieren Sie Montagepreise, Express-Zuschläge und Entsorgungsgebühren.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'yellow',
      path: '/dashboard/workshop/pricing'
    },
    {
      id: 'commissions',
      title: 'Provisionen',
      description: 'Übersicht Ihrer Provisionsabrechnungen und Zahlungsstatus.',
      details: 'Sehen Sie alle abgeschlossenen Aufträge, berechnete Provisionen und Zahlungsstatus. Exportieren Sie Abrechnungen als PDF und verwalten Sie Ihre SEPA-Lastschrift für automatische Provisionsabrechnung.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'indigo',
      path: '/dashboard/workshop/commissions'
    },
    {
      id: 'reviews',
      title: 'Bewertungen',
      description: 'Kundenbewertungen ansehen und auf Feedback reagieren.',
      details: 'Alle Kundenbewertungen im Überblick mit Sternebewertung und Kommentaren. Antworten Sie auf Bewertungen, bedanken Sie sich für positives Feedback oder klären Sie Missverständnisse bei negativen Bewertungen.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: 'pink',
      path: '/dashboard/workshop/reviews'
    },
    {
      id: 'landing-page',
      title: 'Landingpage',
      description: 'Erstellen und verwalten Sie Ihre eigene Werkstatt-Landingpage.',
      details: 'Gestalten Sie eine individuelle Landingpage für Ihre Werkstatt mit Logo, Öffnungszeiten, angebotenen Services und Kontaktinformationen. Kunden können direkt Termine buchen ohne sich zu registrieren.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'cyan',
      path: '/dashboard/workshop/landing-page'
    },
    {
      id: 'vacations',
      title: 'Urlaubszeiten',
      description: 'Verwalten Sie Betriebsferien und Mitarbeiter-Urlaubszeiten.',
      details: 'Blockieren Sie Zeiträume für Betriebsferien oder Mitarbeiter-Urlaub. Während dieser Zeiten werden Sie aus der Anfragen-Suche ausgeschlossen und können keine neuen Termine vereinbaren.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      color: 'orange',
      path: '/dashboard/workshop/vacations'
    },
    {
      id: 'settings',
      title: 'Einstellungen',
      description: 'Werkstatt-Profil, Mitarbeiter, Öffnungszeiten und Zahlungsmethoden verwalten.',
      details: 'Bearbeiten Sie Werkstatt-Informationen, fügen Sie Mitarbeiter hinzu, konfigurieren Sie Google Calendar Integration, verwalten Sie Öffnungszeiten und richten Sie SEPA-Lastschrift für Provisionsabrechnung ein.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'gray',
      path: '/dashboard/workshop/settings'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string; hover: string } } = {
      primary: { bg: 'bg-primary-100', text: 'text-primary-600', hover: 'hover:bg-primary-50' },
      green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-50' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', hover: 'hover:bg-yellow-50' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:bg-indigo-50' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', hover: 'hover:bg-pink-50' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', hover: 'hover:bg-cyan-50' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-50' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600', hover: 'hover:bg-gray-50' }
    }
    return colors[color] || colors.primary
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Willkommen, {session?.user?.name || 'Werkstatt'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Ihre Werkstatt und finden Sie neue Kunden über die Bereifung24-Plattform.
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Feature Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const colorClasses = getColorClasses(section.color)
          return (
            <div key={section.id} className={`bg-white rounded-lg shadow ${colorClasses.hover} transition-all`}>
              <Link href={section.path} className="block p-6">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center ${colorClasses.text}`}>
                    {section.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{section.description}</p>
                    <p className="text-sm text-gray-600">{section.details}</p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Hilfe benötigt?</h3>
        <p className="text-sm text-blue-800 mb-4">
          Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung. Nutzen Sie die Sidebar links, um schnell zwischen den verschiedenen Bereichen zu navigieren.
        </p>
        <div className="flex gap-4">
          <a href="/support" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Support kontaktieren →
          </a>
          <a href="/faq" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            FAQ ansehen →
          </a>
        </div>
      </div>
    </div>
  )
}
