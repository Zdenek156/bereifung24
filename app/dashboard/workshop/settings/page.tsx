'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'

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
  taxMode: string
  website: string | null
  description: string | null
  logoUrl: string | null
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

interface Supplier {
  id: string
  supplier: string
  name: string
  isActive: boolean
  autoOrder: boolean
  priority: number
  lastApiCheck: string | null
  lastApiError: string | null
  apiCallsToday: number
  createdAt: string
  updatedAt: string
}

function SuppliersTab() {
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    supplier: 'TYRESYSTEM',
    name: 'TyreSystem GmbH',
    username: '',
    password: '',
    autoOrder: false,
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/workshop/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupplier = async () => {
    if (!formData.username || !formData.password) {
      alert('Bitte Benutzername und Passwort eingeben')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/workshop/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Lieferant erfolgreich gespeichert')
        setShowAddForm(false)
        setFormData({
          supplier: 'TYRESYSTEM',
          name: 'TyreSystem GmbH',
          username: '',
          password: '',
          autoOrder: false,
        })
        fetchSuppliers()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const response = await fetch('/api/workshop/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: supplier.supplier,
          isActive: !supplier.isActive,
        }),
      })

      if (response.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Error toggling supplier:', error)
    }
  }

  const handleToggleAutoOrder = async (supplier: Supplier) => {
    try {
      const response = await fetch('/api/workshop/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: supplier.supplier,
          autoOrder: !supplier.autoOrder,
        }),
      })

      if (response.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Error toggling auto-order:', error)
    }
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Möchten Sie ${supplier.name} wirklich löschen?`)) return

    try {
      const response = await fetch(`/api/workshop/suppliers?supplier=${supplier.supplier}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Lieferant gelöscht')
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
    }
  }

  const testConnection = async (supplier: Supplier) => {
    try {
      // Call test API endpoint
      const response = await fetch(`/api/admin/tyresystem/test?action=inquiry`)
      if (response.ok) {
        alert('✅ Verbindung erfolgreich!')
      } else {
        alert('❌ Verbindung fehlgeschlagen')
      }
    } catch (error) {
      alert('❌ Verbindungsfehler')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
        <p className="mt-4 text-gray-600">Lade Lieferanten...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <div className="text-blue-600 dark:text-blue-400 text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Wichtige Hinweise:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Automatisch bestellen:</strong> Reifen werden bei Kundenbuchung automatisch beim Lieferanten bestellt</li>
              <li>• <strong>Preisgarantie:</strong> Bei automatischer Bestellung gilt der Preis zum Zeitpunkt der Buchung</li>
              <li>• <strong>Manuelle Bestellung:</strong> Ohne Auto-Order können sich Preise bis zur manuellen Bestellung ändern</li>
              <li>• <strong>Sicherheit:</strong> Zugangsdaten werden verschlüsselt gespeichert (AES-256)</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Add Button */}
      {!showAddForm && suppliers.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🚚</div>
          <h2 className="text-2xl font-bold mb-2">Noch keine Lieferanten konfiguriert</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Fügen Sie Ihren ersten Lieferanten hinzu, um Reifen direkt über die Plattform zu bestellen
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Lieferant hinzufügen
          </Button>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Lieferant hinzufügen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lieferant</label>
              <select
                value={formData.supplier}
                onChange={(e) => {
                  const supplier = e.target.value
                  setFormData({
                    ...formData,
                    supplier,
                    name: supplier === 'TYRESYSTEM' ? 'TyreSystem GmbH' : supplier,
                  })
                }}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="TYRESYSTEM">TyreSystem</option>
                {/* Später mehr Lieferanten hinzufügen */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Anzeigename</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                placeholder="z.B. TyreSystem GmbH"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Benutzername</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                placeholder="Ihr TyreSystem Benutzername"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg pr-12 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Ihr TyreSystem Passwort"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Wird verschlüsselt gespeichert (AES-256)
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                id="autoOrder"
                checked={formData.autoOrder}
                onChange={(e) => setFormData({ ...formData, autoOrder: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="autoOrder" className="text-sm font-medium cursor-pointer">
                Reifen automatisch bei Buchung bestellen
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveSupplier}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Suppliers List */}
      {suppliers.length > 0 && (
        <div className="space-y-4">
          {!showAddForm && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Weiteren Lieferanten hinzufügen
              </Button>
            </div>
          )}

          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{supplier.name}</h3>
                    {supplier.isActive ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-semibold rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Inaktiv
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Automatische Bestellung:</span>
                      <div className="mt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={supplier.autoOrder}
                            onChange={() => handleToggleAutoOrder(supplier)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium">
                            {supplier.autoOrder ? 'Aktiviert ✅' : 'Deaktiviert'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-600 dark:text-gray-400">API-Aufrufe heute:</span>
                      <p className="font-medium">{supplier.apiCallsToday}</p>
                    </div>

                    {supplier.lastApiCheck && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Letzte erfolgreiche Verbindung:</span>
                        <p className="font-medium">
                          {new Date(supplier.lastApiCheck).toLocaleString('de-DE')}
                        </p>
                      </div>
                    )}

                    {supplier.lastApiError && (
                      <div className="col-span-full">
                        <span className="text-red-600 dark:text-red-400">Letzter Fehler:</span>
                        <p className="text-red-800 dark:text-red-300 font-medium text-xs mt-1">
                          {supplier.lastApiError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => testConnection(supplier)}
                    variant="outline"
                    size="sm"
                  >
                    Verbindung testen
                  </Button>
                  <Button
                    onClick={() => handleToggleActive(supplier)}
                    variant="outline"
                    size="sm"
                  >
                    {supplier.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button
                    onClick={() => handleDeleteSupplier(supplier)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkshopSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const [profile, setProfile] = useState<WorkshopProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'contact' | 'hours' | 'payment' | 'sepa' | 'notifications' | 'terminplanung' | 'suppliers'>('contact')
  
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
  
  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    zipCode: '',
    city: '',
    companyName: '',
    taxId: '',
    taxMode: 'STANDARD',
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
    bankAccountHolder: '',
    bankBIC: '',
    bankName: '',
    paypal: false,
    paypalEmail: '',
    stripe: false,
    stripeAccountId: '',
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
    const stripeOnboarding = searchParams.get('stripe_onboarding')
    const stripeRefresh = searchParams.get('stripe_refresh')

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

    // Check Stripe Connect onboarding status
    if (stripeOnboarding === 'success') {
      setMessage({ type: 'success', text: 'Stripe Konto erfolgreich verbunden! Die Zahlungen werden jetzt direkt auf Ihr Konto überwiesen.' })
      // Check account status with Stripe to verify and enable
      checkStripeAccountStatus()
      fetchProfile() // Reload to get updated Stripe account status
    } else if (stripeRefresh === 'true') {
      setMessage({ type: 'info', text: 'Bitte schließen Sie die Stripe-Verifizierung ab.' })
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
          taxMode: data.taxMode || 'STANDARD',
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
              stripe: data.stripeEnabled ?? parsed.stripe ?? false, // Use stripeEnabled from profile
              stripeAccountId: data.stripeAccountId || parsed.stripeAccountId || '',
            })
          } catch (e) {
            console.log('Could not parse payment methods:', e)
          }
        } else {
          // If no payment methods JSON, use direct values from profile
          setPaymentMethods(prev => ({
            ...prev,
            stripe: data.stripeEnabled ?? false,
            stripeAccountId: data.stripeAccountId || '',
          }))
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

  const checkStripeAccountStatus = async () => {
    try {
      console.log('[Stripe] Checking account status...')
      const response = await fetch('/api/workshop/stripe-connect/account-status')
      if (response.ok) {
        const data = await response.json()
        console.log('[Stripe] Account status:', data)
        if (data.onboardingComplete) {
          console.log('[Stripe] Onboarding complete! Account enabled.')
          // Reload profile to show updated status
          setTimeout(() => fetchProfile(), 1000)
        } else {
          console.log('[Stripe] Onboarding not complete yet')
        }
      } else {
        console.error('[Stripe] Failed to check account status:', response.status)
      }
    } catch (error) {
      console.error('[Stripe] Error checking account status:', error)
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Nur JPG, PNG und WebP Dateien sind erlaubt' })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Datei ist zu groß. Maximal 5MB erlaubt.' })
      return
    }

    setUploadingLogo(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/workshop/logo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: 'Logo erfolgreich hochgeladen!' })
        // Update profile with new logo URL
        if (profile) {
          setProfile({ ...profile, logoUrl: data.logoUrl })
        }
        await fetchProfile() // Reload profile to show new logo
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Fehler beim Hochladen' })
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      setMessage({ type: 'error', text: 'Fehler beim Hochladen des Logos' })
    } finally {
      setUploadingLogo(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleDeleteLogo = async () => {
    if (!confirm('Möchten Sie Ihr Logo wirklich löschen?')) {
      return
    }

    setMessage(null)

    try {
      const response = await fetch('/api/workshop/logo', {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Logo erfolgreich gelöscht' })
        // Update profile to remove logo
        if (profile) {
          setProfile({ ...profile, logoUrl: null })
        }
        await fetchProfile() // Reload profile
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Fehler beim Löschen' })
      }
    } catch (error) {
      console.error('Logo delete error:', error)
      setMessage({ type: 'error', text: 'Fehler beim Löschen des Logos' })
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
          paypalEmail: paymentMethods.paypalEmail, // Extract paypalEmail to top level
          stripeAccountId: paymentMethods.stripeAccountId, // Extract stripeAccountId to top level
          stripeEnabled: paymentMethods.stripe, // Extract stripe enabled flag
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Werkstatt-Einstellungen
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Dark Mode Toggle */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Darstellung</h2>
          <label className="flex items-center justify-between cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {theme === 'dark' ? 'Dunkles Design aktiviert' : 'Helles Design aktiviert'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Verification Status */}
        {profile && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Verifizierungsstatus</h2>
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  (Ihr Profil wird von einem Administrator überprüft)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabs - Desktop: Horizontal Navigation, Mobile: Dropdown Select */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 transition-colors">
          {/* Mobile Dropdown */}
          <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700">
            <label htmlFor="tab-select" className="sr-only">Tab auswählen</label>
            <select
              id="tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
            >
              <option value="contact">Kontakt & Unternehmen</option>
              <option value="hours">Öffnungszeiten</option>
              <option value="payment">Zahlungsmöglichkeiten</option>
              <option value="sepa">Bankverbindung & SEPA</option>
              <option value="notifications">Benachrichtigungen</option>
              <option value="terminplanung">Terminplanung</option>
              <option value="suppliers">Lieferanten</option>
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'contact'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Kontakt & Unternehmen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hours')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'hours'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Öffnungszeiten
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'payment'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Zahlungsmöglichkeiten
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sepa')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'sepa'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Bankverbindung & SEPA
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Benachrichtigungen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terminplanung')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'terminplanung'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Terminplanung
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('suppliers')}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'suppliers'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Lieferanten
              </button>
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab: Kontakt & Unternehmen */}
          {activeTab === 'contact' && (
            <>
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ansprechpartner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vorname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nachname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="z.B. 07145 123456"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-900 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">E-Mail kann nicht geändert werden</p>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Werkstatt-Logo</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Laden Sie Ihr Firmenlogo hoch. Es wird in Ihren Angeboten und auf Ihrer Landing Page angezeigt.
            </p>
            
            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {profile?.logoUrl ? (
                  <div className="relative">
                    <img 
                      src={`${profile.logoUrl}?t=${Date.now()}`} 
                      alt="Werkstatt Logo" 
                      className="w-32 h-32 object-contain border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                      key={profile.logoUrl}
                    />
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Logo löschen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {profile?.logoUrl ? 'Neues Logo hochladen' : 'Logo hochladen'}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG oder WebP. Maximal 5MB. Empfohlen: Quadratisches Format (z.B. 500x500px)
                </p>
                {uploadingLogo && (
                  <div className="mt-2 text-sm text-primary-600">
                    Wird hochgeladen...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Unternehmensdaten</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Firmenname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="z.B. Mustermann KFZ-Service GmbH"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Steuernummer / USt-IdNr
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="z.B. DE123456789"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Umsatzsteuer-Status
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="taxMode"
                        value="STANDARD"
                        checked={formData.taxMode === 'STANDARD'}
                        onChange={(e) => setFormData({ ...formData, taxMode: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-300">Regelbesteuerung (Preise inkl. MwSt.)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="taxMode"
                        value="KLEINUNTERNEHMER"
                        checked={formData.taxMode === 'KLEINUNTERNEHMER'}
                        onChange={(e) => setFormData({ ...formData, taxMode: e.target.value })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-300">Kleinunternehmer gemäß §19 UStG (ohne MwSt.)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.ihre-werkstatt.de"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Beschreiben Sie Ihre Werkstatt und Ihre Dienstleistungen..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Adresse</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Straße und Hausnummer *
                </label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="z.B. Hauptstraße 123"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="71706"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stadt *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="z.B. Markgröningen"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Tab: Öffnungszeiten */}
          {activeTab === 'hours' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Öffnungszeiten</h2>
              <div className="space-y-3">
                {Object.entries(openingHoursData).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3">
                    <label className="w-28 text-sm text-gray-700 dark:text-gray-300">{dayLabels[day]}</label>
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
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-gray-500 dark:text-gray-400">bis</span>
                        <select
                          value={hours.to}
                          onChange={(e) => {
                            setOpeningHoursData({
                              ...openingHoursData,
                              [day]: { ...hours, to: e.target.value }
                            })
                          }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400 italic">Geschlossen</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Zahlungsmöglichkeiten */}
          {activeTab === 'payment' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Zahlungsmöglichkeiten für Kunden</h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Wählen Sie aus, welche Zahlungsmethoden Sie Ihren Kunden anbieten möchten. Die Kunden sehen diese Optionen bei der Buchung.
            </p>

            <div className="space-y-4 mb-8">
              {/* Barzahlung */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={paymentMethods.cash}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, cash: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    💵 Barzahlung vor Ort
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Der Kunde zahlt direkt bei Abholung oder nach Fertigstellung in bar
                  </p>
                </div>
              </div>

              {/* Banküberweisung */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={paymentMethods.bankTransfer}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, bankTransfer: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      🏦 Banküberweisung
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Der Kunde überweist den Betrag auf Ihr Bankkonto
                    </p>
                  </div>
                </div>
                {paymentMethods.bankTransfer && (
                  <div className="ml-7 mt-2 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kontoinhaber
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.bankAccountHolder || ''}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, bankAccountHolder: e.target.value })}
                        placeholder="Mustermann GmbH"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        IBAN für Überweisungen
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.bankTransferIban || ''}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, bankTransferIban: e.target.value.toUpperCase() })}
                        placeholder="DE89 3704 0044 0532 0130 00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        BIC (optional)
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.bankBIC || ''}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, bankBIC: e.target.value.toUpperCase() })}
                        placeholder="COBADEFFXXX"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bankname (optional)
                      </label>
                      <input
                        type="text"
                        value={paymentMethods.bankName || ''}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, bankName: e.target.value })}
                        placeholder="Commerzbank"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Diese Bankverbindung wird dem Kunden für Überweisungen angezeigt
                    </p>
                  </div>
                )}
              </div>

              {/* EC-Karte */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={paymentMethods.ecCard}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, ecCard: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    💳 EC-Karte vor Ort
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Der Kunde zahlt mit EC-Karte direkt vor Ort bei Abholung
                  </p>
                </div>
              </div>

              {/* Kreditkarte */}
              <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={paymentMethods.creditCard}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, creditCard: e.target.checked })}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    💳 Kreditkarte vor Ort
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Der Kunde zahlt mit Kreditkarte (Visa, Mastercard, etc.) direkt vor Ort bei Abholung
                  </p>
                </div>
              </div>

              {/* PayPal */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={paymentMethods.paypal}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, paypal: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      💳 PayPal
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Der Kunde zahlt per PayPal
                    </p>
                  </div>
                </div>
                {paymentMethods.paypal && (
                  <div className="ml-7 mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      PayPal E-Mail-Adresse
                    </label>
                    <input
                      type="email"
                      value={paymentMethods.paypalEmail}
                      onChange={(e) => setPaymentMethods({ ...paymentMethods, paypalEmail: e.target.value })}
                      placeholder="ihre-werkstatt@paypal.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Diese E-Mail wird dem Kunden für PayPal-Zahlungen angezeigt
                    </p>
                  </div>
                )}
              </div>

              {/* Stripe Payment Option */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={paymentMethods.stripe}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, stripe: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      💳 Stripe (Kreditkarte, SEPA & mehr)
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Kreditkarte, SEPA-Lastschrift, Sofort, Giropay und mehr
                    </p>
                  </div>
                </div>
                {paymentMethods.stripe && (
                  <div className="ml-7 mt-3 space-y-3">
                    {/* Show connected status if account ID exists */}
                    {paymentMethods.stripeAccountId ? (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                              ✅ Stripe Account verbunden
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400">
                              Zahlungen werden direkt auf Ihr Konto überwiesen
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Account ID anzeigen */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Account ID</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-white">{paymentMethods.stripeAccountId}</p>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/workshop/stripe-connect/account-status')
                                    if (response.ok) {
                                      const data = await response.json()
                                      if (data.onboardingComplete) {
                                        alert('✅ Stripe Account ist vollständig eingerichtet und aktiv!')
                                      } else {
                                        alert('⚠️ Onboarding noch nicht abgeschlossen. Bitte schließen Sie die Einrichtung ab.')
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error checking status:', error)
                                    alert('Fehler beim Prüfen des Status')
                                  }
                                }}
                                className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg transition-colors"
                              >
                                Status prüfen
                              </button>
                            </div>
                          </div>

                          {/* Account erneut verbinden / Dashboard öffnen */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/workshop/stripe-connect/create-account-link', {
                                    method: 'POST'
                                  })
                                  const data = await response.json()
                                  if (data.url) {
                                    window.location.href = data.url
                                  }
                                } catch (error) {
                                  console.error('Error:', error)
                                  alert('Fehler beim Öffnen des Stripe-Dashboards')
                                }
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Account verwalten
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Möchten Sie die Stripe-Verbindung wirklich trennen? Sie können sich jederzeit neu verbinden.')) {
                                  setPaymentMethods({
                                    ...paymentMethods,
                                    stripeAccountId: '',
                                    stripe: false
                                  })
                                }
                              }}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-lg transition-colors"
                              title="Verbindung trennen"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Show onboarding if no account connected */
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                              🚀 Automatisches Stripe Connect Onboarding
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              Zahlungen gehen direkt auf Ihr Konto. Einfaches Setup in 5 Minuten.
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Option 1: Automatisches Onboarding */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setSaving(true)
                                const response = await fetch('/api/workshop/stripe-connect/create-account-link', {
                                  method: 'POST'
                                })
                                const data = await response.json()
                                if (data.url) {
                                  window.location.href = data.url
                                } else {
                                  alert('Fehler beim Erstellen des Stripe-Links')
                                }
                              } catch (error) {
                                console.error('Error:', error)
                                alert('Fehler beim Verbinden mit Stripe')
                              } finally {
                                setSaving(false)
                              }
                            }}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {saving ? 'Lädt...' : 'Jetzt mit Stripe verbinden'}
                          </button>

                          {/* Option 2: Manuelle Eingabe */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Oder: Bereits einen Stripe Account? Account ID manuell eingeben:
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={paymentMethods.stripeAccountId || ''}
                                onChange={(e) => setPaymentMethods({
                                  ...paymentMethods,
                                  stripeAccountId: e.target.value
                                })}
                                placeholder="acct_..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Tab: Bankverbindung & SEPA */}
          {activeTab === 'sepa' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bankverbindung & SEPA-Mandat</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
                  <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-7 h-7 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-1">
                          SEPA-Mandat aktiv
                        </h3>
                        <p className="text-green-700 dark:text-green-400">
                          Ihre Provisionen werden automatisch monatlich eingezogen
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 mb-6">
                    {/* Status Badge */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          mandate.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                            : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
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
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <p className="flex items-start gap-2">
                            <svg className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                              Ihr Mandat wurde erfolgreich eingerichtet und wird bei der <strong>ersten Provisionsabbuchung automatisch aktiviert</strong>. 
                              Sie werden per E-Mail benachrichtigt, sobald das Mandat aktiv ist.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mandate Reference */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mandatsreferenz</h3>
                      <p className="font-mono text-base text-gray-900 dark:text-white">{mandate.reference}</p>
                    </div>

                    {/* Mandate Created Date */}
                    {mandate.createdAt && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mandat erteilt am</h3>
                        <p className="text-base text-gray-900 dark:text-white">
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
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Nächste Abbuchung</h3>
                            <p className="text-base text-blue-700 dark:text-blue-300">
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

                  {/* Mandat ersetzen/ändern Button */}
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                          Bankverbindung geändert?
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                          Wenn Sie Ihre IBAN geändert haben oder ein neues Bankkonto verwenden möchten, 
                          müssen Sie ein neues SEPA-Mandat einrichten. Das alte Mandat wird automatisch ersetzt.
                        </p>
                        <button
                          onClick={createMandate}
                          disabled={creating}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                        >
                          {creating ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Wird erstellt...
                            </span>
                          ) : (
                            'Neues Mandat einrichten (ersetzt das aktuelle)'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Wichtige Informationen</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Die Provisionsrechnung wird am <strong>1. des Monats</strong> erstellt und per E-Mail zugestellt</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Die Abbuchung erfolgt <strong>3-5 Werktage nach Rechnungsstellung</strong> automatisch per SEPA-Lastschrift</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Sie können SEPA-Lastschriften bis zu <strong>8 Wochen nach Abbuchung bei Ihrer Bank widerrufen</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Bei Bankwechsel richten Sie einfach ein neues Mandat ein - das alte wird automatisch ersetzt</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Not Configured State */}
                  {mandateError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">{mandateError}</p>
                    </div>
                  )}

                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                          Kein SEPA-Mandat eingerichtet
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Um Provisionen automatisch abbuchen zu können, benötigen wir ein SEPA-Lastschriftmandat
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Was ist ein SEPA-Lastschriftmandat?</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Mit einem SEPA-Lastschriftmandat autorisieren Sie Bereifung24, fällige Provisionen 
                      automatisch von Ihrem Bankkonto abzubuchen. Dies vereinfacht die monatliche Abrechnung 
                      erheblich.
                    </p>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vorteile:</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
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

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Ablauf:</h4>
                      <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
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

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Sichere Verbindung über GoCardless • Zertifizierter Zahlungsdienstleister
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Benachrichtigungen */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 transition-colors">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 break-words">E-Mail-Benachrichtigungen</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 break-words">
                Verwalten Sie hier, für welche Ereignisse Sie E-Mail-Benachrichtigungen erhalten möchten.
              </p>
              
              <div className="space-y-6">
                {/* Neue Anfragen */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyRequests}
                      onChange={(e) => setFormData({ ...formData, emailNotifyRequests: e.target.checked })}
                      className="mt-1 h-5 w-5 flex-shrink-0 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl flex-shrink-0">📬</span>
                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                          Neue Anfragen
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        Benachrichtigung erhalten, wenn ein Kunde eine neue Reifenanfrage in Ihrem Umkreis erstellt
                      </span>
                    </div>
                  </label>
                </div>

                {/* Angebot angenommen */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyOfferAccepted}
                      onChange={(e) => setFormData({ ...formData, emailNotifyOfferAccepted: e.target.checked })}
                      className="mt-1 h-5 w-5 flex-shrink-0 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                          Angebot angenommen
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        Benachrichtigung erhalten, wenn ein Kunde eines Ihrer Angebote annimmt
                      </span>
                    </div>
                  </label>
                </div>

                {/* Neue Terminbuchungen */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyBookings}
                      onChange={(e) => setFormData({ ...formData, emailNotifyBookings: e.target.checked })}
                      className="mt-1 h-5 w-5 flex-shrink-0 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                          Neue Terminbuchungen
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        Benachrichtigung erhalten, wenn ein Kunde einen Termin bei Ihnen bucht
                      </span>
                    </div>
                  </label>
                </div>

                {/* Neue Bewertungen */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyReviews}
                      onChange={(e) => setFormData({ ...formData, emailNotifyReviews: e.target.checked })}
                      className="mt-1 h-5 w-5 flex-shrink-0 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                          Neue Bewertungen
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        Benachrichtigung erhalten, wenn ein Kunde eine Bewertung für Ihre Werkstatt abgibt
                      </span>
                    </div>
                  </label>
                </div>

                {/* Terminerinnerungen */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyReminders}
                      onChange={(e) => setFormData({ ...formData, emailNotifyReminders: e.target.checked })}
                      className="mt-1 h-5 w-5 flex-shrink-0 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl flex-shrink-0">⏰</span>
                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                          Terminerinnerungen
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        Erinnerung am Tag vor dem Termin erhalten (24 Stunden im Voraus)
                      </span>
                    </div>
                  </label>
                </div>

                {/* Provisionsabrechnungen */}
                <div className="pb-2">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifyCommissions}
                      onChange={(e) => setFormData({ ...formData, emailNotifyCommissions: e.target.checked })}
                      className="mt-1 h-5 w-5 flex-shrink-0 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                          Monatliche Provisionsabrechnungen
                        </span>
                      </div>
                      <span className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        Monatliche Übersicht über fällige Provisionen und Abrechnungsdetails erhalten
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 sm:p-4">
                  <div className="flex gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-300 font-medium break-words">Hinweis zu E-Mail-Benachrichtigungen</p>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1 break-words">
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
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                  : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'
              }`}>
                <div className="flex items-center">
                  {workshopCalendarConnected || employees.some(emp => emp.calendarConnected) ? (
                    <>
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-300">Google Kalender verbunden</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Ihre Termine werden automatisch mit Google Kalender synchronisiert
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-yellow-900 dark:text-yellow-300">Kein Kalender verbunden</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Verbinden Sie Ihren Google Kalender für automatische Terminverwaltung und zur Vermeidung von Doppelbuchungen
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Calendar Mode Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Google Kalender Integration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
                        <div className="font-medium text-gray-900">Werkstatt-Kalender</div>
                        <div className="text-sm text-gray-600">
                          Ein gemeinsamer Kalender für die gesamte Werkstatt
                        </div>
                        {employees.some(emp => emp.calendarConnected) && (
                          <div className="text-xs text-red-600 mt-1">
                            Nicht verfügbar - Mitarbeiter-Kalender bereits verbunden
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
                        <div className="font-medium text-gray-900">Mitarbeiter-Kalender</div>
                        <div className="text-sm text-gray-600">
                          Separate Kalender für jeden Mitarbeiter mit individuellen Arbeitszeiten
                        </div>
                        {workshopCalendarConnected && (
                          <div className="text-xs text-red-600 mt-1">
                            Nicht verfügbar - Werkstatt-Kalender bereits verbunden
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

          {/* Tab: Lieferanten */}
          {activeTab === 'suppliers' && (
            <SuppliersTab />
          )}

          {/* Submit Button (only for non-suppliers tabs) */}
          {activeTab !== 'suppliers' && (
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
          )}
        </form>
      </main>
    </div>
  )
}
