'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'

interface Customer {
  id: string
  customerType: string
  salutation?: string
  firstName: string
  lastName: string
  companyName?: string
  email?: string
  phone?: string
  mobile?: string
  fax?: string
  website?: string
  street?: string
  zipCode?: string
  city?: string
  country?: string
  tags?: string
  segment?: string
  importance: string
  notes?: string
  emailNotifications: boolean
  smsNotifications: boolean
  marketingConsent: boolean
}

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [customerType, setCustomerType] = useState<'PRIVATE' | 'BUSINESS'>('PRIVATE')
  const [salutation, setSalutation] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [fax, setFax] = useState('')
  const [website, setWebsite] = useState('')
  const [street, setStreet] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Deutschland')
  const [tags, setTags] = useState('')
  const [segment, setSegment] = useState('')
  const [importance, setImportance] = useState('NORMAL')
  const [notes, setNotes] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/workshop/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        const customer: Customer = data.customer
        
        setCustomerType(customer.customerType as 'PRIVATE' | 'BUSINESS')
        setSalutation(customer.salutation || '')
        setFirstName(customer.firstName || '')
        setLastName(customer.lastName || '')
        setCompanyName(customer.companyName || '')
        setEmail(customer.email || '')
        setPhone(customer.phone || '')
        setMobile(customer.mobile || '')
        setFax(customer.fax || '')
        setWebsite(customer.website || '')
        setStreet(customer.street || '')
        setZipCode(customer.zipCode || '')
        setCity(customer.city || '')
        setCountry(customer.country || 'Deutschland')
        setTags(customer.tags ? JSON.parse(customer.tags).join(', ') : '')
        setSegment(customer.segment || '')
        setImportance(customer.importance)
        setNotes(customer.notes || '')
        setEmailNotifications(customer.emailNotifications)
        setSmsNotifications(customer.smsNotifications)
        setMarketingConsent(customer.marketingConsent)
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('Fehler beim Laden der Kundendaten')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (customerType === 'PRIVATE' && (!firstName || !lastName)) {
      setError('Vor- und Nachname sind erforderlich')
      return
    }

    if (customerType === 'BUSINESS' && !companyName) {
      setError('Firmenname ist erforderlich')
      return
    }

    if (!email && !phone && !mobile) {
      setError('Mindestens eine Kontaktmöglichkeit ist erforderlich')
      return
    }

    setSaving(true)

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)

      const response = await fetch(`/api/workshop/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerType,
          salutation: salutation || null,
          firstName: customerType === 'PRIVATE' ? firstName : null,
          lastName: customerType === 'PRIVATE' ? lastName : null,
          companyName: customerType === 'BUSINESS' ? companyName : null,
          email: email || null,
          phone: phone || null,
          mobile: mobile || null,
          fax: fax || null,
          website: website || null,
          street: street || null,
          zipCode: zipCode || null,
          city: city || null,
          country: country || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          segment: segment || null,
          importance,
          notes: notes || null,
          emailNotifications,
          smsNotifications,
          marketingConsent,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Aktualisieren des Kunden')
      }

      router.push(`/dashboard/workshop/customers/${customerId}`)
    } catch (error) {
      console.error('Error updating customer:', error)
      setError(error instanceof Error ? error.message : 'Fehler beim Aktualisieren')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Kundendaten...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Kunde bearbeiten</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Kundentyp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kundentyp *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="PRIVATE"
                  checked={customerType === 'PRIVATE'}
                  onChange={(e) => setCustomerType(e.target.value as 'PRIVATE' | 'BUSINESS')}
                  className="mr-2"
                />
                Privatkunde
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="BUSINESS"
                  checked={customerType === 'BUSINESS'}
                  onChange={(e) => setCustomerType(e.target.value as 'PRIVATE' | 'BUSINESS')}
                  className="mr-2"
                />
                Geschäftskunde
              </label>
            </div>
          </div>

          {/* Persönliche Daten */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Persönliche Daten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerType === 'BUSINESS' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenname *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={customerType === 'BUSINESS'}
                  />
                </div>
              )}

              {customerType === 'BUSINESS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anrede
                  </label>
                  <select
                    value={salutation}
                    onChange={(e) => setSalutation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>
              )}

              <div className={customerType === 'BUSINESS' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {customerType === 'BUSINESS' ? 'Ansprechpartner Vorname' : 'Vorname *'}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={customerType === 'PRIVATE'}
                />
              </div>

              <div className={customerType === 'BUSINESS' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {customerType === 'BUSINESS' ? 'Ansprechpartner Nachname' : 'Nachname *'}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={customerType === 'PRIVATE'}
                />
              </div>
            </div>
          </div>

          {/* Kontaktdaten */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontaktdaten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobil
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {customerType === 'BUSINESS' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax
                    </label>
                    <input
                      type="tel"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Adresse</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straße und Hausnummer
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PLZ
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stadt
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Zusätzliche Informationen */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Zusätzliche Informationen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wichtigkeit
                </label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Niedrig</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Hoch</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Stammkunde, Premiumkunde (durch Komma trennen)"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Mehrere Tags durch Komma trennen
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segment
                </label>
                <input
                  type="text"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  placeholder="z.B. Premium, Standard"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Interne Notizen zum Kunden..."
                />
              </div>
            </div>
          </div>

          {/* Benachrichtigungen */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Benachrichtigungen</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="mr-2"
                />
                E-Mail Benachrichtigungen
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  className="mr-2"
                />
                SMS Benachrichtigungen
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mr-2"
                />
                Marketing-Einwilligung (Werbung, Newsletter)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/workshop/customers/${customerId}`)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichere...' : 'Änderungen speichern'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
