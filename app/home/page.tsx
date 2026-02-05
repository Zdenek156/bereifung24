'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Navigation, Star, Check, TrendingUp } from 'lucide-react'

const SERVICES = [
  { id: 'WHEEL_CHANGE', label: 'Räderwechsel', icon: '🔄', description: 'Sommer-/Winterreifen wechseln' },
  { id: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: '🔧', description: 'Reifen flicken und abdichten' },
  { id: 'WHEEL_ALIGNMENT', label: 'Achsvermessung', icon: '📐', description: 'Spur und Sturz einstellen' },
  { id: 'AC_SERVICE', label: 'Klimaanlagen-Service', icon: '❄️', description: 'Wartung und Desinfektion' },
]

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
]

const STATS = [
  { value: '1000+', label: 'Werkstätten' },
  { value: '50.000+', label: 'Zufriedene Kunden' },
  { value: '4.8★', label: 'Durchschnittsbewertung' },
  { value: '24/7', label: 'Online Buchung' },
]

export default function NewHomePage() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState('WHEEL_CHANGE')
  const [postalCode, setPostalCode] = useState('')
  const [radiusKm, setRadiusKm] = useState(25)
  const [useGeolocation, setUseGeolocation] = useState(false)
  
  // Service-specific options (Räderwechsel)
  const [hasBalancing, setHasBalancing] = useState(false)
  const [hasStorage, setHasStorage] = useState(false)

  const handleSearch = () => {
    if (!postalCode && !useGeolocation) {
      alert('Bitte PLZ eingeben oder Standort aktivieren')
      return
    }
    
    // Redirect to public search page (no login required)
    const params = new URLSearchParams({
      service: selectedService,
      radiusKm: radiusKm.toString(),
      ...(postalCode && { postalCode }),
      ...(useGeolocation && { useGeo: 'true' }),
      ...(selectedService === 'WHEEL_CHANGE' && hasBalancing && { balancing: 'true' }),
      ...(selectedService === 'WHEEL_CHANGE' && hasStorage && { storage: 'true' }),
    })
    router.push(`/suche?${params.toString()}`)
  }

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von Ihrem Browser nicht unterstützt')
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setUseGeolocation(true)
        setPostalCode('')
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Standortzugriff verweigert. Bitte PLZ eingeben.')
      }
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation - Blue like current homepage */}
      <nav className="bg-primary-600 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">B24</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bereifung24</h1>
              </div>
            </div>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Booking.com Style */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white pt-12 pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Finde deine Werkstatt
            </h2>
            <p className="text-xl text-primary-100">
              Vergleiche Preise, buche direkt online
            </p>
          </div>

          {/* Search Card - Booking.com Style: One Line */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-3">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Service Dropdown */}
                <div className="flex-1">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                  >
                    {SERVICES.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.icon} {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Input */}
                <div className="flex-1">
                  {!useGeolocation ? (
                    <div className="relative h-16">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="PLZ oder Ort"
                        className="w-full h-full pl-12 pr-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                      />
                    </div>
                  ) : (
                    <div className="h-16 px-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-semibold text-sm">Standort aktiv</span>
                    </div>
                  )}
                </div>

                {/* Radius Dropdown */}
                <div className="w-full md:w-32">
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                  >
                    {RADIUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Geolocation Button */}
                <button
                  onClick={() => {
                    if (useGeolocation) {
                      setUseGeolocation(false)
                    } else {
                      requestGeolocation()
                    }
                  }}
                  className="w-full md:w-auto h-16 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  title={useGeolocation ? 'Standort deaktivieren' : 'Aktuellen Standort nutzen'}
                >
                  <Navigation className="w-5 h-5" />
                  <span className="hidden lg:inline">{useGeolocation ? 'Deaktivieren' : 'Standort nutzen'}</span>
                </button>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto h-16 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Suchen</span>
                </button>
              </div>

              {/* Service-Specific Options - Below Search */}
              {selectedService === 'WHEEL_CHANGE' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={hasBalancing}
                        onChange={(e) => setHasBalancing(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">🎯 Auswuchten inkl.</span>
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={hasStorage}
                        onChange={(e) => setHasStorage(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">📦 Einlagerung gewünscht</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Beliebte Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 cursor-pointer group"
                onClick={() => {
                  setSelectedService(service.id)
                  document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {service.label}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Jetzt Werkstätten vergleichen und direkt buchen
                </p>
                <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                  <span>Mehr erfahren</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">
              Warum Bereifung24?
            </h3>
            <p className="text-xl text-gray-600">
              Die moderne Art, Werkstätten zu finden
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Transparente Preise</h4>
              <p className="text-gray-600">
                Vergleiche Festpreise von geprüften Werkstätten in deiner Nähe
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Sofort buchen</h4>
              <p className="text-gray-600">
                Wähle deinen Wunschtermin und buche direkt online - einfach und schnell
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Geprüfte Qualität</h4>
              <p className="text-gray-600">
                Alle Werkstätten sind geprüft und von echten Kunden bewertet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold mb-6">
            Bereit für deinen Reifenservice?
          </h3>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Über 50.000 zufriedene Kunden vertrauen bereits auf Bereifung24
          </p>
          <button
            onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            Jetzt Werkstatt finden
          </button>
        </div>
      </section>

      {/* Footer - Reused from current homepage */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <h3 className="text-2xl font-bold">Bereifung24</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice. Transparent, fair und einfach.
              </p>
              <div className="flex gap-4">
                <Link href="/app-download" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" title="Mobile App">
                  <span className="text-xl">📱</span>
                </Link>
                <Link href="/karriere" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" title="Karriere">
                  <span className="text-xl">💼</span>
                </Link>
                <a href="mailto:info@bereifung24.de" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" title="Kontakt">
                  <span className="text-xl">📧</span>
                </a>
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/customer" className="hover:text-white transition-colors">Kostenlos registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Anmelden</Link></li>
                <li><Link href="/dashboard/customer/select-service" className="hover:text-white transition-colors">Alle Services</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">So funktioniert's</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* For Workshops */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/werkstatt" className="hover:text-white transition-colors">Werkstatt-Informationen</Link></li>
                <li><Link href="/register/workshop" className="hover:text-white transition-colors">Werkstatt registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Werkstatt-Login</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Preise & Konditionen</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Partner Program */}
            <div className="bg-gradient-to-br from-primary-600/10 to-primary-700/10 rounded-lg p-4 border border-primary-500/20">
              <h4 className="text-lg font-bold mb-3 text-primary-400">💰 Partner werden</h4>
              <p className="text-gray-300 text-sm mb-4">
                Verdiene als Influencer mit unserem Partner-Programm!
              </p>
              <Link 
                href="/influencer" 
                className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Mehr erfahren →
              </Link>
            </div>

            {/* Karriere */}
            <div>
              <h4 className="text-lg font-bold mb-4">Karriere</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/karriere" className="hover:text-white transition-colors">Stellenangebote</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-bold mb-4">Rechtliches</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
                <li><Link href="/cookie-settings" className="hover:text-white transition-colors">Cookie-Einstellungen</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
              <p>&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
              <p className="mt-4 md:mt-0">
                Made with ❤️ in Deutschland
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
