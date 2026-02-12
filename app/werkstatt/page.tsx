'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import RevenueCalculator from '@/components/RevenueCalculator'

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          const duration = 1500
          const start = Date.now()
          const animate = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(target * eased))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString('de-DE')}{suffix}</span>
}

export default function WerkstattInfoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Werkstatt Premium Design */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Top Navigation Bar */}
        <div className="relative border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Bereifung24</h1>
                  <p className="text-xs text-gray-400">Für Werkstätten</p>
                </div>
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Werkstatt-Login
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 md:pt-24 md:pb-40">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
              Für Werkstätten & KFZ-Betriebe
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Erreiche mehr Kunden
            </h2>
            <p className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-gray-300">
              Steigere deine Auslastung
            </p>
            
            <p className="text-xl md:text-2xl mb-4 text-gray-300 font-medium">
              Die digitale Plattform für deine Werkstatt
            </p>
            
            <p className="text-lg mb-10 text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Profitiere von Deutschlands erster digitaler Reifenservice-Plattform. 
              Erreiche neue Kunden, optimiere deine Auslastung, verwalte alles zentral.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register/workshop"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                Werkstatt registrieren
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-lg font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/20"
              >
                Zum Login
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-300">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <span className="text-sm font-medium">Online-Direktbuchungen</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">Keine Grundgebühr</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">Faire Provision</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Workshop Benefits - Premium Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <div className="inline-block mb-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                Deine Vorteile
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Warum Bereifung24 für deine Werkstatt?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Profitiere von der ersten vollständig digitalen Reifenservice-Plattform Deutschlands
              </p>
            </AnimatedSection>

            {/* Stats Counter Bar */}
            <AnimatedSection className="mb-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { value: 500, suffix: '+', label: 'Partner-Werkstätten' },
                  { value: 15000, suffix: '+', label: 'Buchungen' },
                  { value: 98, suffix: '%', label: 'Zufriedenheit' },
                  { value: 0, suffix: '€', label: 'Grundgebühr', static: true },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-6 bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-100">
                    <p className="text-3xl md:text-4xl font-extrabold text-primary-600 mb-1">
                      {stat.static ? `${stat.value}${stat.suffix}` : <CountUp target={stat.value} suffix={stat.suffix} />}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {workshopBenefits.map((benefit, index) => (
                <AnimatedSection key={index} delay={index * 150}>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full group">
                    <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {benefit.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {benefit.description}
                    </p>
                    <ul className="space-y-2">
                      {benefit.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          <span className="text-gray-600">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 md:p-12 rounded-2xl text-center shadow-2xl text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Kostenlose Registrierung • Keine monatlichen Gebühren
              </h3>
              <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                Zahle nur eine faire Provision bei erfolgreicher Vermittlung. Keine versteckten Kosten.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register/workshop"
                  className="px-8 py-4 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  Werkstatt registrieren
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
                >
                  Werkstatt-Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Calculator */}
      <RevenueCalculator />

      {/* How It Works for Workshops */}
      <section className="py-20 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              So einfach geht&apos;s
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              In 3 Schritten online
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Schnell starten, sofort Kunden empfangen
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 max-w-6xl mx-auto relative">
            {/* Connecting lines between steps (desktop) */}
            <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-1 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300 rounded-full z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-pulse" />
            </div>

            {workshopSteps.map((step, index) => (
              <AnimatedSection key={index} delay={index * 250} className="relative z-10">
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 mx-2 mb-4 md:mb-0 group">
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-8 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-4xl mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {step.emoji}
                  </div>
                  <div className="mb-2">
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {/* Time indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                      {step.time}
                    </span>
                  </div>
                </div>

                {/* Mobile connecting arrow */}
                {index < 2 && (
                  <div className="flex justify-center md:hidden my-2">
                    <svg className="w-6 h-6 text-primary-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <div className="inline-block mb-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                Dein Dashboard
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Alles in einer Plattform
              </h2>
              <p className="text-xl text-gray-600">
                Dein komplettes Werkstatt-Management – digital und einfach
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshopFeatures.map((feature, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 h-full group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Bereit durchzustarten?
            </h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Registriere deine Werkstatt jetzt kostenlos – in unter 5 Minuten online und bereit für neue Kunden.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/workshop"
                className="px-10 py-5 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt registrieren
              </Link>
              <Link
                href="/pricing"
                className="px-10 py-5 bg-primary-500 text-white rounded-lg font-bold text-lg hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Preise ansehen
              </Link>
            </div>

            {/* Trust mini-badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-primary-200 text-sm">
              <span className="flex items-center gap-1.5">✓ Keine Vertragslaufzeit</span>
              <span className="flex items-center gap-1.5">✓ Sofort einsatzbereit</span>
              <span className="flex items-center gap-1.5">✓ Persönlicher Support</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <h3 className="text-2xl font-bold">Bereifung24</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice.
              </p>
            </div>

            {/* For Workshops */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/workshop" className="hover:text-white transition-colors">Werkstatt registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Werkstatt-Login</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Preise & Konditionen</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Customer Link */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Zur Kunden-Seite</Link></li>
                <li><Link href="/register/customer" className="hover:text-white transition-colors">Kunde werden</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-bold mb-4">Rechtliches</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
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

// Data Arrays

const workshopBenefits = [
  {
    title: 'Neue Kunden gewinnen',
    icon: '👥',
    description: 'Werde von Autofahrern gefunden, die aktiv nach deinen Services suchen. Kunden buchen direkt bei dir.',
    details: [
      'Kunden finden dich direkt in ihrer Nähe',
      'Direktbuchungen ohne Umwege',
      'Höhere Conversion als klassische Werbung'
    ]
  },
  {
    title: 'Auslastung optimieren',
    icon: '📊',
    description: 'Fülle Lücken in deinem Terminkalender. Kunden buchen deine freien Slots direkt online.',
    details: [
      'Flexible Kalender- & Preisverwaltung',
      'Automatische Terminverwaltung',
      'Echtzeit-Kapazitätsplanung'
    ]
  },
  {
    title: 'Faire Konditionen',
    icon: '💰',
    description: 'Keine monatlichen Fixkosten. Zahle nur bei erfolgreicher Vermittlung eine faire Provision.',
    details: [
      'Keine Grundgebühr',
      'Transparente Provisionsmodelle',
      'Volle Kostenkontrolle'
    ]
  },
  {
    title: 'Digitale Verwaltung',
    icon: '💻',
    description: 'Verwalte Services, Preise, Termine und Mitarbeiter zentral. Alles in einem Dashboard.',
    details: [
      'Intuitive Bedienung',
      'Mitarbeiter- & Urlaubsverwaltung',
      'Automatisierte Prozesse'
    ]
  }
]

const workshopSteps = [
  {
    title: 'Profil einrichten',
    description: 'Registriere dich kostenlos und hinterlege deine Services, Preise und Öffnungszeiten. In wenigen Minuten online.',
    emoji: '🏪',
    time: '⏱ ca. 5 Minuten'
  },
  {
    title: 'Kalender verbinden',
    description: 'Verbinde deinen bestehenden Kalender – Bereifung24 synchronisiert automatisch deine Verfügbarkeit in Echtzeit.',
    emoji: '📅',
    time: '⏱ 1 Klick'
  },
  {
    title: 'Direkt gebucht werden',
    description: 'Kunden finden dich, buchen und bezahlen direkt online. Du erhältst alle Details automatisch – einfach loslegen.',
    emoji: '✅',
    time: '⏱ Sofort startklar'
  }
]

const workshopFeatures = [
  {
    icon: '📅',
    title: 'Terminkalender',
    description: 'Verwalte alle Termine zentral. Kunden buchen deine freien Slots direkt online.'
  },
  {
    icon: '👨‍🔧',
    title: 'Mitarbeiterverwaltung',
    description: 'Weise Termine Mitarbeitern zu. Verwalte Urlaube und Auslastung.'
  },
  {
    icon: '🌐',
    title: 'Eigene Landing Page',
    description: 'Erstelle deine eigene Werkstatt-Webseite mit Infos, Öffnungszeiten und Google Maps Integration.'
  },
  {
    icon: '🧮',
    title: 'Automatische Preiskalkulation',
    description: 'Lege einmal deine Preiskalkulation fest - das System berechnet alle Preise automatisch für dich.'
  },
  {
    icon: '💶',
    title: 'Preismanagement',
    description: 'Passe Preise flexibel an. Erstelle Sonderangebote und Pakete.'
  },
  {
    icon: '📊',
    title: 'Statistiken',
    description: 'Behalte den Überblick über Buchungen, Auslastung und Umsätze.'
  },
  {
    icon: '⭐',
    title: 'Bewertungssystem',
    description: 'Sammle positive Bewertungen und baue Vertrauen auf.'
  },
  {
    icon: '🔔',
    title: 'Benachrichtigungen',
    description: 'Erhalte sofort Bescheid über neue Buchungen und Kundennachrichten.'
  },
  {
    icon: '🎧',
    title: 'Persönlicher Support',
    description: 'Direkter Ansprechpartner bei Bereifung24. Wir helfen dir bei Fragen und Problemen.'
  }
]
