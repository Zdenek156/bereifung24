'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileData {
  name: string
  channelName: string
  channelUrl: string
  platform: string
  paymentMethod: string
  accountHolder: string
  iban: string
  bic: string
  paypalEmail: string
  taxType: string
  companyName: string
  taxId: string
  street: string
  zipCode: string
  city: string
  country: string
}

export default function InfluencerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    channelName: '',
    channelUrl: '',
    platform: '',
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
    country: 'Deutschland'
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/influencer/profile')
      
      if (!res.ok) {
        router.push('/influencer/login')
        return
      }

      const data = await res.json()
      setFormData({
        name: data.influencer.name || '',
        channelName: data.influencer.channelName || '',
        channelUrl: data.influencer.channelUrl || '',
        platform: data.influencer.platform || '',
        paymentMethod: data.influencer.paymentMethod || '',
        accountHolder: data.influencer.accountHolder || '',
        iban: data.influencer.iban || '',
        bic: data.influencer.bic || '',
        paypalEmail: data.influencer.paypalEmail || '',
        taxType: data.influencer.taxType || '',
        companyName: data.influencer.companyName || '',
        taxId: data.influencer.taxId || '',
        street: data.influencer.street || '',
        zipCode: data.influencer.zipCode || '',
        city: data.influencer.city || '',
        country: data.influencer.country || 'Deutschland'
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/influencer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Fehler beim Speichern' })
      } else {
        setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ein Fehler ist aufgetreten' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwörter stimmen nicht überein' })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Passwort muss mindestens 8 Zeichen lang sein' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/influencer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Fehler beim Ändern des Passworts' })
      } else {
        setMessage({ type: 'success', text: 'Passwort erfolgreich geändert' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ein Fehler ist aufgetreten' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Profil bearbeiten</h1>
          <button
            onClick={() => router.push('/influencer/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {message && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
            'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grundinformationen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plattform</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kanal Name</label>
                <input
                  type="text"
                  value={formData.channelName}
                  onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="z.B. @username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kanal URL</label>
                <input
                  type="url"
                  value={formData.channelUrl}
                  onChange={(e) => setFormData({...formData, channelUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Zahlungsinformationen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsmethode</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Keine</option>
                  <option value="BANK_TRANSFER">Banküberweisung</option>
                  <option value="PAYPAL">PayPal</option>
                </select>
              </div>

              {formData.paymentMethod === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontoinhaber</label>
                    <input
                      type="text"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <input
                      type="text"
                      value={formData.iban}
                      onChange={(e) => setFormData({...formData, iban: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BIC</label>
                    <input
                      type="text"
                      value={formData.bic}
                      onChange={(e) => setFormData({...formData, bic: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'PAYPAL' && (
                <div className="pl-4 border-l-2 border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">PayPal E-Mail</label>
                  <input
                    type="email"
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData({...formData, paypalEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tax Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Steuerinformationen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steuertyp</label>
                <select
                  value={formData.taxType}
                  onChange={(e) => setFormData({...formData, taxType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Keine</option>
                  <option value="INDIVIDUAL">Privatperson</option>
                  <option value="BUSINESS">Unternehmen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer / USt-ID</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              {formData.taxType === 'BUSINESS' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firmenname</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Speichert...' : 'Profil speichern'}
            </button>
          </div>
        </form>

        {/* Password Change */}
        <form onSubmit={handlePasswordChange} className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Passwort ändern</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktuelles Passwort</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort bestätigen</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
              >
                {saving ? 'Ändert...' : 'Passwort ändern'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
