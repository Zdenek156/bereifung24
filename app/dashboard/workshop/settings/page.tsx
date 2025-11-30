'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WorkshopProfile {
  email: string
  firstName: string
  lastName: string
  phone: string | null
  street: string | null
  zipCode: string | null
  city: string | null
  companyName: string
  taxId: string | null
  website: string | null
  description: string | null
  openingHours: string | null
  isVerified: boolean
  verifiedAt: string | null
  iban: string | null
  accountHolder: string | null
  sepaMandateRef: string | null
  sepaMandateDate: string | null
  emailNotifyRequests: boolean
  emailNotifyOfferAccepted: boolean
  emailNotifyBookings: boolean
  emailNotifyReviews: boolean
  emailNotifyReminders: boolean
  emailNotifyCommissions: boolean
  paymentMethods?: {
    cash: boolean
    ecCard: boolean
    creditCard: boolean
    bankTransfer: boolean
    bankTransferIban?: string
    paypal: boolean
    paypalEmail?: string
  }
  calendarMode?: string
  googleRefreshToken?: string | null
  googleCalendarId?: string | null
}

export default function WorkshopSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<WorkshopProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'contact' | 'hours' | 'payment' | 'sepa' | 'notifications' | 'terminplanung'>('contact')
  
  // Scheduling state
  const [calendarMode, setCalendarMode] = useState<'workshop' | 'employees'>('workshop')
  const [workshopCalendarConnected, setWorkshopCalendarConnected] = useState(false)
  const [employees, setEmployees] = useState<Array<{
    id: string
    name: string
    email: string
    calendarConnected: boolean
    googleCalendarId?: string | null
    workingHours: {
      monday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
      tuesday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
      wednesday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
      thursday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
      friday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
      saturday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
      sunday: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string }
    }
  }>>([])
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '' })
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)
  
  // SEPA Mandate state
  const [mandate, setMandate] = useState<any>(null)
  const [mandateLoading, setMandateLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [mandateError, setMandateError] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    zipCode: '',
    city: '',
    companyName: '',
    taxId: '',
    website: '',
    description: '',
    openingHours: '',
    iban: '',
    accountHolder: '',
    emailNotifyRequests: true,
    emailNotifyOfferAccepted: true,
    emailNotifyBookings: true,
    emailNotifyReviews: true,
    emailNotifyReminders: true,
    emailNotifyCommissions: true,
  })

  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    ecCard: false,
    creditCard: false,
    bankTransfer: false,
    bankTransferIban: '',
    paypal: false,
    paypalEmail: '',
  })

  const [openingHoursData, setOpeningHoursData] = useState({
    monday: { from: '08:00', to: '18:00', closed: false },
    tuesday: { from: '08:00', to: '18:00', closed: false },
    wednesday: { from: '08:00', to: '18:00', closed: false },
    thursday: { from: '08:00', to: '18:00', closed: false },
    friday: { from: '08:00', to: '18:00', closed: false },
    saturday: { from: '09:00', to: '13:00', closed: false },
    sunday: { from: '09:00', to: '13:00', closed: true },
  })

  const dayLabels: { [key: string]: string } = {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }

    fetchProfile()
  }, [session, status, router])

  // Fetch SEPA mandate status when SEPA tab is active
  useEffect(() => {
    if (activeTab === 'sepa' && session?.user?.role === 'WORKSHOP') {
      fetchMandateStatus()
    }
  }, [activeTab, session])

  // Check URL parameters for tab and success message
  useEffect(() => {
    const tab = searchParams.get('tab')
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (tab === 'terminplanung') {
      setActiveTab('terminplanung')
    } else if (tab === 'sepa') {
      setActiveTab('sepa')
    }

    if (success === 'calendar_connected') {
      setMessage({ type: 'success', text: 'Google Kalender erfolgreich verbunden!' })
      // Reload employees to get updated calendar status
      fetchProfile()
    }

    if (error) {
      const errorMessages: { [key: string]: string } = {
        'calendar_auth_denied': 'Sie haben die Kalenderverbindung abgebrochen oder die Berechtigung verweigert.',
        'no_code': 'Kein Autorisierungscode erhalten. Bitte versuchen Sie es erneut.',
        'invalid_state': 'Ungültiger Status. Bitte versuchen Sie es erneut.',
        'token_exchange_failed': 'Fehler beim Austausch der Tokens. Bitte versuchen Sie es erneut.',
        'callback_failed': 'Fehler bei der Kalenderverbindung. Bitte versuchen Sie es erneut.'
      }
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'Fehler bei der Kalenderverbindung' 
      })
    }
  }, [searchParams])

  const fetchProfile = async () => {
    let profileData: any = null
    try {
      const response = await fetch('/api/workshop/profile')
      if (response.ok) {
        const data = await response.json()
        profileData = data
        setProfile(data)
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          street: data.street || '',
          zipCode: data.zipCode || '',
          city: data.city || '',
          companyName: data.companyName || '',
          taxId: data.taxId || '',
          website: data.website || '',
          description: data.description || '',
          openingHours: data.openingHours || '',
          iban: data.iban || '',
          accountHolder: data.accountHolder || '',
          emailNotifyRequests: data.emailNotifyRequests ?? true,
          emailNotifyOfferAccepted: data.emailNotifyOfferAccepted ?? true,
          emailNotifyBookings: data.emailNotifyBookings ?? true,
          emailNotifyReviews: data.emailNotifyReviews ?? true,
          emailNotifyReminders: data.emailNotifyReminders ?? true,
          emailNotifyCommissions: data.emailNotifyCommissions ?? true,
        })
        
        // Set calendar mode and connection status
        setCalendarMode(data.calendarMode || 'workshop')
        setWorkshopCalendarConnected(!!data.googleRefreshToken)

        // Parse opening hours JSON if available
        if (data.openingHours) {
          try {
            const parsed = JSON.parse(data.openingHours)
            setOpeningHoursData(parsed)
          } catch (e) {
            console.log('Could not parse opening hours:', e)
          }
        }

        // Parse payment methods JSON if available
        if (data.paymentMethods) {
          try {
            const parsed = typeof data.paymentMethods === 'string' 
              ? JSON.parse(data.paymentMethods) 
              : data.paymentMethods
            setPaymentMethods({
              cash: parsed.cash ?? true,
              ecCard: parsed.ecCard ?? false,
              creditCard: parsed.creditCard ?? false,
              bankTransfer: parsed.bankTransfer ?? false,
              bankTransferIban: parsed.bankTransferIban || '',
              paypal: parsed.paypal ?? false,
              paypalEmail: parsed.paypalEmail || '',
            })
          } catch (e) {
            console.log('Could not parse payment methods:', e)
          }
        }
      }
      
      // Fetch employees if available
      const employeesResponse = await fetch('/api/workshop/employees')
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json()
        console.log('Employees data:', employeesData)
        if (employeesData.employees) {
          const mappedEmployees = employeesData.employees.map((emp: any) => {
            let parsedWorkingHours
            try {
              if (emp.workingHours) {
                // Parse once
                let parsed = JSON.parse(emp.workingHours)
                // Check if it's still a string (double-encoded), parse again
                if (typeof parsed === 'string') {
                  parsed = JSON.parse(parsed)
                }
                parsedWorkingHours = parsed
              } else {
                parsedWorkingHours = {
                  monday: { from: '08:00', to: '17:00', working: true },
                  tuesday: { from: '08:00', to: '17:00', working: true },
                  wednesday: { from: '08:00', to: '17:00', working: true },
                  thursday: { from: '08:00', to: '17:00', working: true },
                  friday: { from: '08:00', to: '17:00', working: true },
                  saturday: { from: '09:00', to: '13:00', working: false },
                  sunday: { from: '09:00', to: '13:00', working: false },
                }
              }
            } catch (e) {
              console.error('Error parsing working hours for employee:', emp.id, e)
              parsedWorkingHours = {
                monday: { from: '08:00', to: '17:00', working: true },
                tuesday: { from: '08:00', to: '17:00', working: true },
                wednesday: { from: '08:00', to: '17:00', working: true },
                thursday: { from: '08:00', to: '17:00', working: true },
                friday: { from: '08:00', to: '17:00', working: true },
                saturday: { from: '09:00', to: '13:00', working: false },
                sunday: { from: '09:00', to: '13:00', working: false },
              }
            }
            
            return {
              id: emp.id,
              name: emp.name,
              email: emp.email,
              calendarConnected: !!emp.googleRefreshToken,
              googleCalendarId: emp.googleCalendarId,
              workingHours: parsedWorkingHours
            }
          })
          console.log('Mapped employees:', mappedEmployees)
          setEmployees(mappedEmployees)
          
          // Auto-select employee calendar mode if any employee is connected but workshop calendar is not
          const hasConnectedEmployee = mappedEmployees.some((emp: any) => emp.calendarConnected)
          if (hasConnectedEmployee && !profileData?.googleRefreshToken) {
            setCalendarMode('employees')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMandateStatus = async () => {
    try {
      setMandateLoading(true)
      const response = await fetch('/api/workshop/sepa-mandate/status')
      if (response.ok) {
        const data = await response.json()
        setMandate(data)
      } else {
        console.error('Failed to fetch mandate status')
      }
    } catch (error) {
      console.error('Error fetching mandate status:', error)
    } finally {
      setMandateLoading(false)
    }
  }

  const createMandate = async () => {
    try {
      setCreating(true)
      setMandateError('')

      const response = await fetch('/api/workshop/sepa-mandate/create', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        
        // Session token is now stored in database, just redirect
        window.location.href = data.redirectUrl
      } else {
        const errorData = await response.json()
        setMandateError(errorData.error || 'Fehler beim Erstellen des Mandats')
      }
    } catch (error) {
      console.error('Error creating mandate:', error)
      setMandateError('Netzwerkfehler beim Erstellen des Mandats')
    } finally {
      setCreating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Convert opening hours to JSON string
      const openingHoursJson = JSON.stringify(openingHoursData)
      // Convert payment methods to JSON string
      const paymentMethodsJson = JSON.stringify(paymentMethods)

      const response = await fetch('/api/workshop/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          openingHours: openingHoursJson,
          paymentMethods: paymentMethodsJson,
          oldIban: profile?.iban, // For SEPA mandate date update
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' })
        fetchProfile() // Reload profile
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Fehler beim Speichern' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  const handleCalendarModeChange = async (newMode: 'workshop' | 'employees') => {
    setCalendarMode(newMode)
    
    // Save to database immediately
    try {
      await fetch('/api/workshop/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarMode: newMode
        }),
      })
    } catch (error) {
      console.error('Error saving calendar mode:', error)
    }
  }

  const handleConnectCalendar = async (type: 'workshop' | 'employee', employeeId?: string) => {
    try {
      const response = await fetch('/api/gcal/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, employeeId })
      })
      
      const data = await response.json()
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Starten der Verbindung' })
      }
    } catch (error) {
      console.error('Calendar connect error:', error)
      setMessage({ type: 'error', text: 'Fehler beim Verbinden des Kalenders' })
    }
  }

  const handleDisconnectCalendar = async (type: 'workshop' | 'employee', employeeId?: string) => {
    if (!confirm('Möchten Sie die Kalenderverbindung wirklich trennen?')) {
      return
    }
    
    try {
      const response = await fetch('/api/gcal/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, employeeId })
      })
      
      if (response.ok) {
        if (type === 'workshop') {
          setWorkshopCalendarConnected(false)
          setMessage({ type: 'success', text: 'Kalenderverbindung getrennt' })
        } else if (employeeId) {
          const updated = employees.map(emp => 
            emp.id === employeeId ? { ...emp, calendarConnected: false, googleCalendarId: null } : emp
          )
          setEmployees(updated)
          setMessage({ type: 'success', text: 'Mitarbeiter-Kalenderverbindung getrennt' })
        }
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Trennen der Verbindung' })
      }
    } catch (error) {
      console.error('Calendar disconnect error:', error)
      setMessage({ type: 'error', text: 'Fehler beim Trennen der Verbindung' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Werkstatt-Einstellungen
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie Ihr Profil und Ihre Unternehmensdaten
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Verification Status */}
        {profile && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Verifizierungsstatus</h2>
            {profile.isVerified ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Verifiziert</span>
                {profile.verifiedAt && (
                  <span className="text-sm text-gray-600">
                    seit {new Date(profile.verifiedAt).toLocaleDateString('de-DE')}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Noch nicht verifiziert</span>
                <span className="text-sm text-gray-600">
                  (Ihr Profil wird von einem Administrator überprüft)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'contact'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kontakt & Unternehmen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hours')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'hours'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Öffnungszeiten
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'payment'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Zahlungsmöglichkeiten
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sepa')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sepa'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bankverbindung & SEPA
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Benachrichtigungen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terminplanung')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'terminplanung'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Terminplanung
              </button>
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab: Kontakt & Unternehmen */}
          {activeTab === 'contact' && (
            <>
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Ansprechpartner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vorname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nachname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="z.B. 07145 123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">E-Mail kann nicht geändert werden</p>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Unternehmensdaten</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firmenname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="z.B. Mustermann KFZ-Service GmbH"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Steuernummer / USt-IdNr
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="z.B. DE123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.ihre-werkstatt.de"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Beschreiben Sie Ihre Werkstatt und Ihre Dienstleistungen..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Adresse</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straße und Hausnummer *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="z.B. Hauptstraße 123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="71706"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="z.B. Markgröningen"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Tab: Öffnungszeiten */}
          {activeTab === 'hours' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Öffnungszeiten</h2>
              <div className="space-y-3">
                {Object.entries(openingHoursData).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3">
                    <label className="w-28 text-sm text-gray-700">{dayLabels[day]}</label>
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => {
                        setOpeningHoursData({
                          ...openingHoursData,
                          [day]: { ...hours, closed: !e.target.checked }
                        })
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    {!hours.closed ? (
                      <>
                        <select
                          value={hours.from}
                          onChange={(e) => {
                            setOpeningHoursData({
                              ...openingHoursData,
                              [day]: { ...hours, from: e.target.value }
                            })
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        >
                          {['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'].map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-gray-500">bis</span>
                        <select
                          value={hours.to}
                          onChange={(e) => {
                            setOpeningHoursData({
                              ...openingHoursData,
                              [day]: { ...hours, to: e.target.value }
                            })
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        >
                          {['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'].map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Geschlossen</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Zahlungsmöglichkeiten */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Zahlungsmöglichkeiten für Kunden</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Wählen Sie aus, welche Zahlungsmethoden Sie Ihren Kunden anbieten möchten. Die Kunden sehen diese Optionen bei der Buchung.
            </p>

            <div className="space-y-4 mb-8">
              {/* Barzahlung */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={paymentMethods.cash}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, cash: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                    💵 Barzahlung vor Ort
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Der Kunde zahlt direkt bei Abholung oder nach Fertigstellung in bar
                  </p>
                </div>
              </div>

              {/* Banküberweisung */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={paymentMethods.bankTransfer}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, bankTransfer: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                      🏦 Banküberweisung
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Der Kunde überweist den Betrag auf Ihr Bankkonto
                    </p>
                  </div>
                </div>
                {paymentMethods.bankTransfer && (
                  <div className="ml-7 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN für Überweisungen
                    </label>
                    <input
                      type="text"
                      value={paymentMethods.bankTransferIban}
                      onChange={(e) => setPaymentMethods({ ...paymentMethods, bankTransferIban: e.target.value.toUpperCase() })}
                      placeholder="DE89 3704 0044 0532 0130 00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Diese IBAN wird dem Kunden für Überweisungen angezeigt
                    </p>
                  </div>
                )}
              </div>

              {/* EC-Karte */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={paymentMethods.ecCard}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, ecCard: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                    💳 EC-Karte vor Ort
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Der Kunde zahlt mit EC-Karte direkt vor Ort bei Abholung
                  </p>
                </div>
              </div>

              {/* Kreditkarte */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={paymentMethods.creditCard}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, creditCard: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                    💳 Kreditkarte vor Ort
                  </label>
                  <p className="text-xs text-gray-600 mt-1">
                    Der Kunde zahlt mit Kreditkarte (Visa, Mastercard, etc.) direkt vor Ort bei Abholung
                  </p>
                </div>
              </div>

              {/* PayPal */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={paymentMethods.paypal}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, paypal: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                      💳 PayPal
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Der Kunde zahlt per PayPal
                    </p>
                  </div>
                </div>
                {paymentMethods.paypal && (
                  <div className="ml-7 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PayPal E-Mail-Adresse
                    </label>
                    <input
                      type="email"
                      value={paymentMethods.paypalEmail}
                      onChange={(e) => setPaymentMethods({ ...paymentMethods, paypalEmail: e.target.value })}
                      placeholder="ihre-werkstatt@paypal.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Diese E-Mail wird dem Kunden für PayPal-Zahlungen angezeigt
                    </p>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Tab: Bankverbindung & SEPA */}
          {activeTab === 'sepa' && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bankverbindung & SEPA-Mandat</h2>
              <p className="text-sm text-gray-600 mb-6">
                Für die automatische Einziehung Ihrer Provisionen (4,9% pro Auftrag)
              </p>

              {mandateLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : mandate?.configured ? (
                <div>
                  {/* Configured State */}
                  <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-7 h-7 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-900 mb-1">
                          SEPA-Mandat aktiv
                        </h3>
                        <p className="text-green-700">
                          Ihre Provisionen werden automatisch monatlich eingezogen
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 mb-6">
                    {/* Status Badge */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          mandate.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            mandate.status === 'active' 
                              ? 'bg-green-600' 
                              : 'bg-yellow-600'
                          }`}></span>
                          {mandate.status === 'active' ? 'Aktiv' : 
                           mandate.status === 'pending_submission' ? 'Wird eingereicht' :
                           mandate.status === 'submitted' ? 'Eingereicht' :
                           mandate.status}
                        </span>
                      </div>
                      {mandate.status !== 'active' && (
                        <div className="text-sm text-gray-600 mt-1">
                          <p className="flex items-start gap-2">
                            <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                              Ihr Mandat wird derzeit von GoCardless geprüft. Die Aktivierung dauert in der Regel <strong>3-5 Werktage</strong>. 
                              Sie werden per E-Mail benachrichtigt, sobald das Mandat aktiv ist.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mandate Reference */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Mandatsreferenz</h3>
                      <p className="font-mono text-base text-gray-900">{mandate.reference}</p>
                    </div>

                    {/* Mandate Created Date */}
                    {mandate.createdAt && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Mandat erteilt am</h3>
                        <p className="text-base text-gray-900">
                          {new Date(mandate.createdAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Next Charge Date */}
                    {mandate.nextChargeDate && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h3 className="text-sm font-medium text-blue-900 mb-1">Nächste Abbuchung</h3>
                            <p className="text-base text-blue-700">
                              {new Date(mandate.nextChargeDate).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Wichtige Informationen</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Die Provisionen werden automatisch am 1. jedes Monats berechnet</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Der Lastschrifteinzug erfolgt 3 Werktage nach Rechnungsstellung</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Sie können das Mandat jederzeit widerrufen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Sie erhalten vor jeder Abbuchung eine Rechnung per E-Mail</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Not Configured State */}
                  {mandateError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{mandateError}</p>
                    </div>
                  )}

                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">
                          Kein SEPA-Mandat eingerichtet
                        </h3>
                        <p className="text-yellow-700">
                          Um Provisionen automatisch abbuchen zu können, benötigen wir ein SEPA-Lastschriftmandat
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Was ist ein SEPA-Lastschriftmandat?</h3>
                    <p className="text-gray-600">
                      Mit einem SEPA-Lastschriftmandat autorisieren Sie Bereifung24, fällige Provisionen 
                      automatisch von Ihrem Bankkonto abzubuchen. Dies vereinfacht die monatliche Abrechnung 
                      erheblich.
                    </p>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Vorteile:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Automatische monatliche Abrechnung
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Transparente Rechnungsstellung
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Keine vergessenen Zahlungen
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Jederzeit widerrufbar
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Ablauf:</h4>
                      <ol className="space-y-1 text-sm text-blue-800">
                        <li>1. Klicken Sie auf "SEPA-Mandat einrichten"</li>
                        <li>2. Sie werden zu GoCardless weitergeleitet (unser Zahlungsdienstleister)</li>
                        <li>3. Geben Sie Ihre Bankdaten ein und bestätigen Sie das Mandat</li>
                        <li>4. Nach Bestätigung werden Sie zurück zu Bereifung24 geleitet</li>
                      </ol>
                    </div>

                    <button
                      onClick={createMandate}
                      disabled={creating}
                      className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {creating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Wird erstellt...
                        </span>
                      ) : (
                        'SEPA-Mandat einrichten'
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Sichere Verbindung über GoCardless • Zertifizierter Zahlungsdienstleister
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Benachrichtigungen */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">E-Mail-Benachrichtigungen</h2>
              <p className="text-sm text-gray-600 mb-6">
                Verwalten Sie hier, für welche Ereignisse Sie E-Mail-Benachrichtigungen erhalten möchten.
              </p>
              
              <div className="space-y-6">
                {/* Neue Anfragen */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyRequests}
                      onChange={(e) => setFormData({ ...formData, emailNotifyRequests: e.target.checked })}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📬</span>
                        <span className="block text-base font-semibold text-gray-900">
                          Neue Anfragen
                        </span>
                      </div>
                      <span className="block text-sm text-gray-600 mt-1">
                        Benachrichtigung erhalten, wenn ein Kunde eine neue Reifenanfrage in Ihrem Umkreis erstellt
                      </span>
                    </div>
                  </label>
                </div>

                {/* Angebot angenommen */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyOfferAccepted}
                      onChange={(e) => setFormData({ ...formData, emailNotifyOfferAccepted: e.target.checked })}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <span className="block text-base font-semibold text-gray-900">
                          Angebot angenommen
                        </span>
                      </div>
                      <span className="block text-sm text-gray-600 mt-1">
                        Benachrichtigung erhalten, wenn ein Kunde eines Ihrer Angebote annimmt
                      </span>
                    </div>
                  </label>
                </div>

                {/* Neue Terminbuchungen */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyBookings}
                      onChange={(e) => setFormData({ ...formData, emailNotifyBookings: e.target.checked })}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📅</span>
                        <span className="block text-base font-semibold text-gray-900">
                          Neue Terminbuchungen
                        </span>
                      </div>
                      <span className="block text-sm text-gray-600 mt-1">
                        Benachrichtigung erhalten, wenn ein Kunde einen Termin bei Ihnen bucht
                      </span>
                    </div>
                  </label>
                </div>

                {/* Neue Bewertungen */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyReviews}
                      onChange={(e) => setFormData({ ...formData, emailNotifyReviews: e.target.checked })}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⭐</span>
                        <span className="block text-base font-semibold text-gray-900">
                          Neue Bewertungen
                        </span>
                      </div>
                      <span className="block text-sm text-gray-600 mt-1">
                        Benachrichtigung erhalten, wenn ein Kunde eine Bewertung für Ihre Werkstatt abgibt
                      </span>
                    </div>
                  </label>
                </div>

                {/* Terminerinnerungen */}
                <div className="border-b border-gray-200 pb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyReminders}
                      onChange={(e) => setFormData({ ...formData, emailNotifyReminders: e.target.checked })}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⏰</span>
                        <span className="block text-base font-semibold text-gray-900">
                          Terminerinnerungen
                        </span>
                      </div>
                      <span className="block text-sm text-gray-600 mt-1">
                        Erinnerung am Tag vor dem Termin erhalten (24 Stunden im Voraus)
                      </span>
                    </div>
                  </label>
                </div>

                {/* Provisionsabrechnungen */}
                <div className="pb-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyCommissions}
                      onChange={(e) => setFormData({ ...formData, emailNotifyCommissions: e.target.checked })}
                      className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <span className="block text-base font-semibold text-gray-900">
                          Monatliche Provisionsabrechnungen
                        </span>
                      </div>
                      <span className="block text-sm text-gray-600 mt-1">
                        Monatliche Übersicht über fällige Provisionen und Abrechnungsdetails erhalten
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-900 font-medium">Hinweis zu E-Mail-Benachrichtigungen</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Wichtige System-E-Mails (z.B. Passwort-Reset, Sicherheitsmeldungen) werden unabhängig von diesen Einstellungen immer versendet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Terminplanung */}
          {activeTab === 'terminplanung' && (
            <div className="space-y-6">
              {/* Calendar Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${
                workshopCalendarConnected || employees.some(emp => emp.calendarConnected)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center">
                  {workshopCalendarConnected || employees.some(emp => emp.calendarConnected) ? (
                    <>
                      <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-green-900">Google Kalender verbunden</p>
                        <p className="text-sm text-green-700">
                          Ihre Termine werden automatisch mit Google Kalender synchronisiert
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-yellow-900">Kein Kalender verbunden</p>
                        <p className="text-sm text-yellow-700">
                          Verbinden Sie Ihren Google Kalender für automatische Terminverwaltung und zur Vermeidung von Doppelbuchungen
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Calendar Mode Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Google Kalender Integration</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Verbinden Sie Ihre Google Kalender, um Termine automatisch zu synchronisieren und Doppelbuchungen zu vermeiden.
                </p>

                <div className="space-y-4">
                  <label className="block">
                    <div className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                      employees.some(emp => emp.calendarConnected) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-500'
                    }`}
                         style={{ borderColor: calendarMode === 'workshop' ? '#2563eb' : '#e5e7eb' }}>
                      <input
                        type="radio"
                        name="calendarMode"
                        value="workshop"
                        checked={calendarMode === 'workshop'}
                        onChange={(e) => handleCalendarModeChange(e.target.value as 'workshop' | 'employees')}
                        disabled={employees.some(emp => emp.calendarConnected)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">🏢 Werkstatt-Kalender</div>
                        <div className="text-sm text-gray-600">
                          Ein gemeinsamer Kalender für die gesamte Werkstatt
                        </div>
                        {employees.some(emp => emp.calendarConnected) && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ Nicht verfügbar - Mitarbeiter-Kalender bereits verbunden
                          </div>
                        )}
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <div className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-colors ${
                      workshopCalendarConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-500'
                    }`}
                         style={{ borderColor: calendarMode === 'employees' ? '#2563eb' : '#e5e7eb' }}>
                      <input
                        type="radio"
                        name="calendarMode"
                        value="employees"
                        checked={calendarMode === 'employees'}
                        onChange={(e) => handleCalendarModeChange(e.target.value as 'workshop' | 'employees')}
                        disabled={workshopCalendarConnected}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">👥 Mitarbeiter-Kalender</div>
                        <div className="text-sm text-gray-600">
                          Separate Kalender für jeden Mitarbeiter mit individuellen Arbeitszeiten
                        </div>
                        {workshopCalendarConnected && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ Nicht verfügbar - Werkstatt-Kalender bereits verbunden
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Workshop Calendar Mode */}
              {calendarMode === 'workshop' && (
                <div className="space-y-6">
                  {employees.some(emp => emp.calendarConnected) && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-yellow-900">Mitarbeiter-Kalender aktiv</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Sie verwenden bereits Mitarbeiter-Kalender. Um den gemeinsamen Werkstatt-Kalender zu nutzen, trennen Sie zuerst alle Mitarbeiter-Kalenderverbindungen.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Werkstatt-Kalender verbinden</h3>
                    
                    {workshopCalendarConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="font-medium text-green-900">Kalender verbunden</div>
                          <div className="text-sm text-green-700">
                            {profile?.googleCalendarId && profile.googleCalendarId !== 'primary' 
                              ? profile.googleCalendarId 
                              : session?.user?.email || 'Google Kalender'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDisconnectCalendar('workshop')}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Verbindung trennen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnectCalendar('workshop')}
                      disabled={employees.some(emp => emp.calendarConnected)}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-3 border-2 rounded-lg transition-colors ${
                        employees.some(emp => emp.calendarConnected)
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                          : 'bg-white border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                      }`}
                      title={employees.some(emp => emp.calendarConnected) ? 'Nicht verfügbar - Mitarbeiter-Kalender sind verbunden' : ''}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="font-medium text-gray-700">Mit Google Kalender verbinden</span>
                    </button>
                  )}
                  </div>
                </div>
              )}

              {/* Employee Calendar Mode */}
              {calendarMode === 'employees' && (
                <div className="space-y-6">
                  {workshopCalendarConnected && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-yellow-900">Werkstatt-Kalender aktiv</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Sie verwenden bereits den gemeinsamen Werkstatt-Kalender. Um Mitarbeiter-Kalender zu nutzen, trennen Sie zuerst die Verbindung zum Werkstatt-Kalender.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Mitarbeiter verwalten</h3>
                      <button
                        type="button"
                        onClick={() => setShowAddEmployee(true)}
                        disabled={workshopCalendarConnected}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          workshopCalendarConnected
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        + Mitarbeiter hinzufügen
                      </button>
                    </div>

                    {/* Add Employee Form */}
                    {showAddEmployee && (
                      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Neuen Mitarbeiter hinzufügen</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <input
                            type="text"
                            placeholder="Name"
                            value={newEmployee.name}
                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="email"
                            placeholder="E-Mail"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (newEmployee.name && newEmployee.email) {
                                try {
                                  const workingHours = {
                                    monday: { from: '08:00', to: '17:00', working: true },
                                    tuesday: { from: '08:00', to: '17:00', working: true },
                                    wednesday: { from: '08:00', to: '17:00', working: true },
                                    thursday: { from: '08:00', to: '17:00', working: true },
                                    friday: { from: '08:00', to: '17:00', working: true },
                                    saturday: { from: '09:00', to: '13:00', working: false },
                                    sunday: { from: '09:00', to: '13:00', working: false },
                                  }
                                  
                                  const response = await fetch('/api/workshop/employees', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name: newEmployee.name,
                                      email: newEmployee.email,
                                      workingHours: JSON.stringify(workingHours)
                                    })
                                  })
                                  
                                  if (response.ok) {
                                    const createdEmployee = await response.json()
                                    setEmployees([...employees, {
                                      id: createdEmployee.id,
                                      name: createdEmployee.name,
                                      email: createdEmployee.email,
                                      calendarConnected: false,
                                      workingHours: workingHours
                                    }])
                                    setNewEmployee({ name: '', email: '' })
                                    setShowAddEmployee(false)
                                    setMessage({ type: 'success', text: 'Mitarbeiter erfolgreich hinzugefügt!' })
                                  } else {
                                    setMessage({ type: 'error', text: 'Fehler beim Hinzufügen des Mitarbeiters' })
                                  }
                                } catch (error) {
                                  console.error('Error adding employee:', error)
                                  setMessage({ type: 'error', text: 'Fehler beim Hinzufügen des Mitarbeiters' })
                                }
                              }
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            Hinzufügen
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddEmployee(false)
                              setNewEmployee({ name: '', email: '' })
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Employee List */}
                    {employees.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">Noch keine Mitarbeiter hinzugefügt</p>
                        <p className="text-sm">Fügen Sie Mitarbeiter hinzu, um deren Kalender zu verwalten</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {employees.map((employee, index) => (
                          <div key={employee.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4 bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                  {employee.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-sm text-gray-600">{employee.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {employee.calendarConnected ? (
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      <span>
                                        {employee.googleCalendarId && employee.googleCalendarId !== 'primary'
                                          ? employee.googleCalendarId
                                          : employee.email}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDisconnectCalendar('employee', employee.id)}
                                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                                    >
                                      Trennen
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleConnectCalendar('employee', employee.id)}
                                    disabled={workshopCalendarConnected}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${
                                      workshopCalendarConnected
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                    }`}
                                    title={workshopCalendarConnected ? 'Nicht verfügbar - Werkstatt-Kalender ist verbunden' : ''}
                                  >
                                    Kalender verbinden
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) return
                                    
                                    try {
                                      const response = await fetch(`/api/workshop/employees/${employee.id}`, {
                                        method: 'DELETE'
                                      })
                                      
                                      if (response.ok) {
                                        setEmployees(employees.filter(e => e.id !== employee.id))
                                        setMessage({ type: 'success', text: 'Mitarbeiter erfolgreich gelöscht' })
                                      } else {
                                        setMessage({ type: 'error', text: 'Fehler beim Löschen des Mitarbeiters' })
                                      }
                                    } catch (error) {
                                      console.error('Error deleting employee:', error)
                                      setMessage({ type: 'error', text: 'Fehler beim Löschen des Mitarbeiters' })
                                    }
                                  }}
                                  disabled={workshopCalendarConnected}
                                  className={`p-2 rounded transition-colors ${
                                    workshopCalendarConnected
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                  title={workshopCalendarConnected ? 'Nicht verfügbar - Werkstatt-Kalender ist verbunden' : ''}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            {/* Working Hours Section */}
                            <div className="border-t border-gray-200">
                              <div className="p-4 flex items-center justify-between">
                                <h5 className="text-sm font-medium text-gray-900">Arbeitszeiten & Pausen</h5>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmployeeId(editingEmployeeId === employee.id ? null : employee.id)}
                                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                >
                                  {editingEmployeeId === employee.id ? 'Schließen' : 'Bearbeiten'}
                                </button>
                              </div>
                              
                              {editingEmployeeId === employee.id && (
                                <div className="px-4 pb-4">
                                  <div className="space-y-3 mb-4">
                                    {Object.entries(dayLabels).map(([dayKey, dayLabel]) => {
                                      const hours = employee.workingHours?.[dayKey as keyof typeof employee.workingHours]
                                      if (!hours) return null
                                      return (
                                        <div key={dayKey} className="border border-gray-200 rounded-lg p-3">
                                          <div className="flex items-center gap-4 mb-2">
                                            <div className="w-24 text-sm text-gray-700 font-medium">{dayLabel}</div>
                                            <label className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={hours.working}
                                                onChange={(e) => {
                                                  const updated = [...employees]
                                                  updated[index].workingHours[dayKey as keyof typeof employee.workingHours].working = e.target.checked
                                                  setEmployees(updated)
                                                }}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                              />
                                              <span className="text-sm text-gray-600">Arbeitstag</span>
                                            </label>
                                            {hours.working && (
                                              <>
                                                <input
                                                  type="time"
                                                  value={hours.from}
                                                  onChange={(e) => {
                                                    const updated = [...employees]
                                                    updated[index].workingHours[dayKey as keyof typeof employee.workingHours].from = e.target.value
                                                    setEmployees(updated)
                                                  }}
                                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                <span className="text-gray-500">-</span>
                                                <input
                                                  type="time"
                                                  value={hours.to}
                                                  onChange={(e) => {
                                                    const updated = [...employees]
                                                    updated[index].workingHours[dayKey as keyof typeof employee.workingHours].to = e.target.value
                                                    setEmployees(updated)
                                                  }}
                                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                              </>
                                            )}
                                          </div>
                                          {hours.working && (
                                            <div className="flex items-center gap-4 ml-28 pt-2 border-t border-gray-100 mt-2">
                                              <span className="text-xs text-gray-500 font-medium">Pause:</span>
                                              <input
                                                type="time"
                                                value={hours.breakFrom || ''}
                                                onChange={(e) => {
                                                  const updated = [...employees]
                                                  updated[index].workingHours[dayKey as keyof typeof employee.workingHours].breakFrom = e.target.value
                                                  setEmployees(updated)
                                                }}
                                                placeholder="Von"
                                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                              />
                                              <span className="text-gray-500">-</span>
                                              <input
                                                type="time"
                                                value={hours.breakTo || ''}
                                                onChange={(e) => {
                                                  const updated = [...employees]
                                                  updated[index].workingHours[dayKey as keyof typeof employee.workingHours].breakTo = e.target.value
                                                  setEmployees(updated)
                                                }}
                                                placeholder="Bis"
                                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                              />
                                              {(hours.breakFrom || hours.breakTo) && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...employees]
                                                    updated[index].workingHours[dayKey as keyof typeof employee.workingHours].breakFrom = undefined
                                                    updated[index].workingHours[dayKey as keyof typeof employee.workingHours].breakTo = undefined
                                                    setEmployees(updated)
                                                  }}
                                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                >
                                                  Entfernen
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                  
                                  {/* Save Working Hours Button */}
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/workshop/employees/${employee.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              workingHours: JSON.stringify(employee.workingHours)
                                            })
                                          })
                                          
                                          if (response.ok) {
                                            setMessage({ type: 'success', text: 'Arbeitszeiten erfolgreich gespeichert!' })
                                            setEditingEmployeeId(null)
                                          } else {
                                            setMessage({ type: 'error', text: 'Fehler beim Speichern der Arbeitszeiten' })
                                          }
                                        } catch (error) {
                                          console.error('Error saving working hours:', error)
                                          setMessage({ type: 'error', text: 'Fehler beim Speichern der Arbeitszeiten' })
                                        }
                                      }}
                                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                                    >
                                      Speichern
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingEmployeeId(null)
                                        // Reload to discard changes
                                        fetchProfile()
                                      }}
                                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                      Abbrechen
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/workshop"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
