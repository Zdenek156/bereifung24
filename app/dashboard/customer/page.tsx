'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import WeatherWidgetCompact from './components/WeatherWidgetCompact'
import CO2CompactBar from './components/CO2CompactBar'
import NextAppointmentCard from './components/NextAppointmentCard'
import TireStorageCard from './components/TireStorageCard'
import AIChatWidget from './components/AIChatWidget'
import SeasonalRecommendation from './components/SeasonalRecommendation'

interface DashboardSummary {
  nextAppointment: any | null
  recentBookings: any[]
  tireStorage: any[]
  totalCompletedBookings: number
}

interface ProfileStatus {
  incomplete: boolean
  missing: string[]
}

export default function CustomerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null)

  // Check URL parameters for success message
  useEffect(() => {
    const success = searchParams.get('success')
    
    if (success) {
      const successMessages: { [key: string]: string } = {
        'repair': 'Ihre Reparaturanfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'alignment': 'Ihre Achsvermessungs-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'other-services': 'Ihre Service-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'wheel-change': 'Ihre Räderwechsel-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'motorcycle': 'Ihre Motorradreifen-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'tires': 'Ihre Reifenanfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'climate': 'Ihre Klimaservice-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'brakes': 'Ihre Bremsen-Service-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'battery': 'Ihre Batterie-Service-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.'
      }
      
      setSuccessMessage(successMessages[success] || 'Ihre Anfrage wurde erfolgreich erstellt!')
      
      // Clear the success message after 10 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/customer/dashboard-summary')
        if (res.ok) {
          const data = await res.json()
          setSummary(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error)
      } finally {
        setSummaryLoading(false)
      }
    }
    fetchSummary()
  }, [])

  // Check if profile is complete (address, phone)
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json()
          const missing: string[] = []
          if (!data.street?.trim()) missing.push('Straße')
          if (!data.zipCode?.trim()) missing.push('PLZ')
          if (!data.city?.trim()) missing.push('Stadt')
          if (!data.phone?.trim()) missing.push('Telefonnummer')
          if (missing.length > 0) {
            setProfileStatus({ incomplete: true, missing })
          }
        }
      } catch (error) {
        console.error('Error checking profile:', error)
      }
    }
    checkProfile()
  }, [])

  // Seasonal CTA text
  const getCtaText = () => {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 4) return 'Reifenwechsel-Saison – Jetzt Termin sichern'
    if (month >= 9 && month <= 10) return 'Reifenwechsel-Saison – Jetzt Termin sichern'
    return 'Service direkt buchen'
  }

  const getCtaSubtext = () => {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 4) return 'Sommerreifen-Wechsel steht an – Werkstatt finden, Preise vergleichen & direkt buchen!'
    if (month >= 9 && month <= 10) return 'Winterreifen-Wechsel steht an – Werkstatt finden, Preise vergleichen & direkt buchen!'
    return 'Werkstatt finden, Preise vergleichen, Termin wählen & sicher bezahlen - alles in einem Schritt!'
  }

  return (
    <div className="p-6">
      {/* Header (no notification bell) */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Willkommen, {session?.user?.name || 'Kunde'}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Schön, dass Sie da sind. Hier finden Sie eine Übersicht über Ihre Aktivitäten.
        </p>
      </div>

      {/* Profile Completion Banner */}
      {profileStatus?.incomplete && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 p-4 rounded-lg shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Profil vervollständigen</h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Bitte ergänzen Sie Ihre Adressdaten, um Buchungen durchführen zu können. Es fehlen: <strong>{profileStatus.missing.join(', ')}</strong>
              </p>
              <button
                onClick={() => router.push('/dashboard/customer/settings')}
                className="mt-2 inline-flex items-center gap-1 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Jetzt vervollständigen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setProfileStatus(null)}
              className="ml-3 inline-flex text-amber-400 hover:text-amber-500 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="inline-flex text-green-400 hover:text-green-500 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Banner – improved with gradient, pulse icon, shadow button, seasonal text */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 dark:from-green-600 dark:via-green-500 dark:to-emerald-400 rounded-xl shadow-xl p-6 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDF2LTFoLTF2MXoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4 flex-1">
              {/* Pulse animation on lightning icon */}
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse-soft">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-white flex-1">
                <h2 className="text-xl lg:text-2xl font-bold mb-1">{getCtaText()}</h2>
                <p className="text-green-100 text-sm lg:text-base">
                  {getCtaSubtext()}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="px-8 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 hover:shadow-xl transition-all duration-200 font-bold text-lg shadow-lg flex items-center justify-center gap-2 whitespace-nowrap transform hover:scale-[1.02]"
            >
              Jetzt buchen
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* CO₂ Compact Bar (full width, only when bookings exist) */}
      <div className="mb-6">
        <CO2CompactBar totalCompletedBookings={summary?.totalCompletedBookings || 0} />
      </div>

      {/* Three-column widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left: Weather Widget (compact) */}
        <WeatherWidgetCompact />

        {/* Middle: Next Appointment / Bookings */}
        <NextAppointmentCard
          nextAppointment={summary?.nextAppointment || null}
          recentBookings={summary?.recentBookings || []}
          loading={summaryLoading}
        />

        {/* Right: Tire Storage */}
        <TireStorageCard
          tireStorage={summary?.tireStorage || []}
          loading={summaryLoading}
          compact
        />
      </div>

      {/* KI Reifen-Berater Chat */}
      <div className="mb-6">
        <AIChatWidget />
      </div>

      {/* Seasonal Recommendation (full width, replaces "So funktioniert Bereifung24") */}
      <SeasonalRecommendation />

      {/* Custom CSS for pulse animation */}
      <style jsx global>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
