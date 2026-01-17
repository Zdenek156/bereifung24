'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import BackButton from '@/components/BackButton'

interface Influencer {
  id: string
  email: string
  code: string
  name: string | null
  platform: string | null
  channelName: string | null
  channelUrl: string | null
  additionalChannels: any
  isActive: boolean
  isRegistered: boolean
  commissionPer1000Views: number
  commissionPerRegistration: number
  commissionPerAcceptedOffer: number
  activeFrom: string
  activeUntil: string | null
  isUnlimited: boolean
  paymentMethod: string | null
  accountHolder: string | null
  iban: string | null
  bic: string | null
  paypalEmail: string | null
  taxType: string | null
  companyName: string | null
  taxId: string | null
  street: string | null
  zipCode: string | null
  city: string | null
  country: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function InfluencerDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    name: '',
    platform: '',
    channelName: '',
    channelUrl: '',
    commissionPer1000Views: 300,
    commissionPerRegistration: 1500,
    commissionPerAcceptedOffer: 2500,
    activeFrom: '',
    activeUntil: '',
    isUnlimited: true,
    isActive: true,
    paymentMethod: '',
    accountHolder: '',
    iban: '',
    bic: '',
    paypalEmail: '',
    taxType: '',
    companyName: '',
    taxId: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'Deutschland',
    notes: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadInfluencer()
    }
  }, [status, router, id])

  const loadInfluencer = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/influencers/${id}`)
      
      if (!res.ok) {
        throw new Error('Failed to load influencer')
      }
      
      const data = await res.json()
      setInfluencer(data)
      
      // Populate form data
      setFormData({
        email: data.email || '',
        code: data.code || '',
        name: data.name || '',
        platform: data.platform || '',
        channelName: data.channelName || '',
        channelUrl: data.channelUrl || '',
        commissionPer1000Views: data.commissionPer1000Views || 300,
        commissionPerRegistration: data.commissionPerRegistration || 1500,
        commissionPerAcceptedOffer: data.commissionPerAcceptedOffer || 2500,
        activeFrom: data.activeFrom ? data.activeFrom.split('T')[0] : '',
        activeUntil: data.activeUntil ? data.activeUntil.split('T')[0] : '',
        isUnlimited: data.isUnlimited ?? true,
        isActive: data.isActive ?? true,
        paymentMethod: data.paymentMethod || '',
        accountHolder: data.accountHolder || '',
        iban: data.iban || '',
        bic: data.bic || '',
        paypalEmail: data.paypalEmail || '',
        taxType: data.taxType || '',
        companyName: data.companyName || '',
        taxId: data.taxId || '',
        street: data.street || '',
        zipCode: data.zipCode || '',
        city: data.city || '',
        country: data.country || 'Deutschland',
        notes: data.notes || ''
      })
    } catch (err) {
      console.error('Error loading influencer:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const res = await fetch(`/api/admin/influencers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Speichern')
      }
      
      await loadInfluencer()
      setIsEditing(false)
      alert('Influencer erfolgreich aktualisiert!')
    } catch (err: any) {
      console.error('Error saving influencer:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('de-DE')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Lädt...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Influencer nicht gefunden
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2">
              <BackButton />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Influencer bearbeiten' : 'Influencer Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              Code: {influencer.code} • {influencer.email}
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bearbeiten
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    loadInfluencer()
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Speichert...' : 'Speichern'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Grundinformationen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail *
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase"
                      required
                    />
                  ) : (
                    <p className="text-gray-900 font-mono">{influencer.code}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.name || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Channel Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Kanal-Informationen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plattform
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Keine</option>
                      <option value="YOUTUBE">YouTube</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="TIKTOK">TikTok</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="TWITTER">Twitter</option>
                      <option value="WEBSITE">Website</option>
                      <option value="OTHER">Andere</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{influencer.platform || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kanal Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.channelName}
                      onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="z.B. @username"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.channelName || '-'}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kanal URL
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.channelUrl}
                      onChange={(e) => setFormData({...formData, channelUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="https://..."
                    />
                  ) : (
                    <p className="text-gray-900">
                      {influencer.channelUrl ? (
                        <a href={influencer.channelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {influencer.channelUrl}
                        </a>
                      ) : '-'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Commission Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Provisionssätze</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pro 1000 Views
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.commissionPer1000Views}
                      onChange={(e) => setFormData({...formData, commissionPer1000Views: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.commissionPer1000Views} Cent</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(isEditing ? formData.commissionPer1000Views : influencer.commissionPer1000Views)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pro Registrierung
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.commissionPerRegistration}
                      onChange={(e) => setFormData({...formData, commissionPerRegistration: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.commissionPerRegistration} Cent</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(isEditing ? formData.commissionPerRegistration : influencer.commissionPerRegistration)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pro Angenommenem Angebot
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.commissionPerAcceptedOffer}
                      onChange={(e) => setFormData({...formData, commissionPerAcceptedOffer: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.commissionPerAcceptedOffer} Cent</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(isEditing ? formData.commissionPerAcceptedOffer : influencer.commissionPerAcceptedOffer)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Zahlungsinformationen</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zahlungsmethode
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Keine</option>
                      <option value="BANK_TRANSFER">Banküberweisung</option>
                      <option value="PAYPAL">PayPal</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {influencer.paymentMethod === 'BANK_TRANSFER' ? 'Banküberweisung' :
                       influencer.paymentMethod === 'PAYPAL' ? 'PayPal' : '-'}
                    </p>
                  )}
                </div>

                {(isEditing ? formData.paymentMethod === 'BANK_TRANSFER' : influencer.paymentMethod === 'BANK_TRANSFER') && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kontoinhaber
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.accountHolder}
                          onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <p className="text-gray-900">{influencer.accountHolder || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.iban}
                          onChange={(e) => setFormData({...formData, iban: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <p className="text-gray-900 font-mono">{influencer.iban || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BIC
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.bic}
                          onChange={(e) => setFormData({...formData, bic: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <p className="text-gray-900 font-mono">{influencer.bic || '-'}</p>
                      )}
                    </div>
                  </div>
                )}

                {(isEditing ? formData.paymentMethod === 'PAYPAL' : influencer.paymentMethod === 'PAYPAL') && (
                  <div className="pl-4 border-l-2 border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PayPal E-Mail
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.paypalEmail}
                        onChange={(e) => setFormData({...formData, paypalEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="text-gray-900">{influencer.paypalEmail || '-'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tax Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Steuerinformationen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Steuertyp
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.taxType}
                      onChange={(e) => setFormData({...formData, taxType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Keine</option>
                      <option value="INDIVIDUAL">Privatperson</option>
                      <option value="BUSINESS">Unternehmen</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {influencer.taxType === 'INDIVIDUAL' ? 'Privatperson' :
                       influencer.taxType === 'BUSINESS' ? 'Unternehmen' : '-'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Steuernummer / USt-ID
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.taxId || '-'}</p>
                  )}
                </div>

                {(isEditing ? formData.taxType === 'BUSINESS' : influencer.taxType === 'BUSINESS') && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firmenname
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="text-gray-900">{influencer.companyName || '-'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Adresse</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straße
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({...formData, street: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.street || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.zipCode || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.city || '-'}</p>
                  )}
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{influencer.country || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Notizen</h2>
              {isEditing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Interne Notizen..."
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{influencer.notes || 'Keine Notizen'}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Status</h2>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="rounded"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={influencer.isActive}
                        disabled
                        className="rounded"
                      />
                    )}
                    <span className="text-sm font-medium">Aktiv</span>
                  </label>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">Registriert</p>
                  <p className="font-medium">
                    {influencer.isRegistered ? (
                      <span className="text-green-600">✓ Ja</span>
                    ) : (
                      <span className="text-gray-500">✗ Nein</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Period */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Zeitraum</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aktiv ab
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.activeFrom}
                      onChange={(e) => setFormData({...formData, activeFrom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(influencer.activeFrom)}</p>
                  )}
                </div>
                
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={formData.isUnlimited}
                        onChange={(e) => setFormData({...formData, isUnlimited: e.target.checked})}
                        className="rounded"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={influencer.isUnlimited}
                        disabled
                        className="rounded"
                      />
                    )}
                    <span className="text-sm font-medium">Unbegrenzt</span>
                  </label>
                  
                  {(isEditing ? !formData.isUnlimited : !influencer.isUnlimited) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aktiv bis
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={formData.activeUntil}
                          onChange={(e) => setFormData({...formData, activeUntil: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <p className="text-gray-900">{formatDate(influencer.activeUntil)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Metadaten</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-mono text-xs">{influencer.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Erstellt:</span>
                  <span className="ml-2">{formatDate(influencer.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Aktualisiert:</span>
                  <span className="ml-2">{formatDate(influencer.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
