'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  paymentMethods?: {
    cash: boolean
    ecCard: boolean
    creditCard: boolean
    bankTransfer: boolean
    bankTransferIban?: string
    paypal: boolean
    paypalEmail?: string
  }
}

export default function WorkshopSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<WorkshopProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'contact' | 'hours' | 'payment' | 'sepa' | 'notifications'>('contact')
  
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

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/workshop/profile')
      if (response.ok) {
        const data = await response.json()
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
        })

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
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
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
              Für die Auszahlung Ihrer Provisionen (4,9% pro Auftrag)
            </p>
            
            {profile?.sepaMandateRef && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">SEPA-Mandatsreferenz</p>
                    <p className="text-blue-700 mt-1 font-mono">{profile.sepaMandateRef}</p>
                    {profile.sepaMandateDate && (
                      <p className="text-blue-600 mt-1">
                        Mandat erteilt am: {new Date(profile.sepaMandateDate).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IBAN
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Für die Auszahlung Ihrer Provisionen (4,9% pro Auftrag)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontoinhaber
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="Name des Kontoinhabers"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">SEPA-Lastschriftmandat</h3>
                <p className="text-sm text-gray-600">
                  Mit der Angabe Ihrer Bankverbindung erteilen Sie Bereifung24 (Zdenek Kyzlink, 
                  Jahnstraße 2, 71706 Markgröningen) ein SEPA-Lastschriftmandat für die Einziehung 
                  der Plattformgebühr (4,9% pro Auftrag, monatlich abgerechnet). Sie werden vor jedem Lastschrifteinzug 
                  per E-Mail informiert.
                </p>
                {formData.iban !== profile?.iban && formData.iban && (
                  <p className="text-sm text-orange-600 mt-2 font-medium">
                    ⚠️ Bei Änderung der IBAN wird ein neues SEPA-Mandat mit heutigem Datum erstellt.
                  </p>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Tab: Benachrichtigungen */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">E-Mail-Benachrichtigungen</h2>
            
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailNotifyRequests}
                  onChange={(e) => setFormData({ ...formData, emailNotifyRequests: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    Anfragen-Benachrichtigungen
                  </span>
                  <span className="block text-sm text-gray-600">
                    Ich möchte per E-Mail benachrichtigt werden, wenn ein Kunde eine neue Reifenafrage in meinem Umkreis erstellt
                  </span>
                </div>
              </label>
            </div>
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
