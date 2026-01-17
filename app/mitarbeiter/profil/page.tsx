'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

interface EmployeeProfile {
  id?: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  address?: string
  city?: string
  postalCode?: string
  taxId?: string
  socialSecurityId?: string
  taxClass?: string
  bankAccount?: string
  bankName?: string
  bic?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
}

interface Employee {
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  department?: string
}

export default function ProfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [profile, setProfile] = useState<EmployeeProfile>({})
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stammdaten' | 'bank' | 'notfall'>(
    'stammdaten'
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchProfile()
    }
  }, [status, session, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/employee/profile')
      if (res.ok) {
        const data = await res.json()
        setEmployee(data.employee)
        setProfile(data.profile || {})
        setProfileImage(data.employee?.profileImage || null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validierung
    if (!file.type.startsWith('image/')) {
      alert('Bitte nur Bilder hochladen!')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Bild darf maximal 5MB groß sein!')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/employee/profile/image', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setProfileImage(data.imageUrl)
        alert('Profilbild erfolgreich hochgeladen!')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Fehler beim Hochladen des Bildes')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (res.ok) {
        alert('Profil erfolgreich gespeichert!')
      } else {
        throw new Error('Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Fehler beim Speichern des Profils')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Lade Profil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2">
                <BackButton />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
              <p className="text-sm text-gray-600 mt-1">
                {employee?.firstName} {employee?.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee Info Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-start">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profilbild"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                  {employee?.firstName?.[0]}
                  {employee?.lastName?.[0]}
                </div>
              )}
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                title="Profilbild ändern"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
            <div className="ml-6 flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {employee?.firstName} {employee?.lastName}
              </h2>
              <p className="text-gray-600">{employee?.position || 'Mitarbeiter'}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div>📧 {employee?.email}</div>
                {employee?.phone && <div>📞 {employee?.phone}</div>}
                {employee?.department && <div>🏢 {employee?.department}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('stammdaten')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'stammdaten'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Stammdaten
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bank'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🏦 Bankverbindung
              </button>
              <button
                onClick={() => setActiveTab('notfall')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'notfall'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🚨 Notfallkontakt
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Stammdaten Tab */}
            {activeTab === 'stammdaten' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Geburtsdatum
                    </label>
                    <input
                      type="date"
                      value={profile.birthDate || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, birthDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Geburtsort
                    </label>
                    <input
                      type="text"
                      value={profile.birthPlace || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, birthPlace: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationalität
                    </label>
                    <input
                      type="text"
                      value={profile.nationality || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, nationality: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Deutsch"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Steuer-ID
                    </label>
                    <input
                      type="text"
                      value={profile.taxId || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, taxId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="12 345 678 901"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sozialversicherungsnummer
                    </label>
                    <input
                      type="text"
                      value={profile.socialSecurityId || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          socialSecurityId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="12 345678 A 123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Steuerklasse
                    </label>
                    <select
                      value={profile.taxClass || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, taxClass: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="I">I - Ledig</option>
                      <option value="II">II - Alleinerziehend</option>
                      <option value="III">III - Verheiratet (höheres Einkommen)</option>
                      <option value="IV">IV - Verheiratet (gleiches Einkommen)</option>
                      <option value="V">V - Verheiratet (geringeres Einkommen)</option>
                      <option value="VI">VI - Nebenjob</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Adresse
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Straße und Hausnummer
                      </label>
                      <input
                        type="text"
                        value={profile.address || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. Hauptstraße 123"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PLZ
                        </label>
                        <input
                          type="text"
                          value={profile.postalCode || ''}
                          onChange={(e) =>
                            setProfile({ ...profile, postalCode: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="12345"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stadt
                        </label>
                        <input
                          type="text"
                          value={profile.city || ''}
                          onChange={(e) =>
                            setProfile({ ...profile, city: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="z.B. München"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bankverbindung Tab */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-xl">🔒</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Sicherheitshinweis:</strong> Ihre Bankdaten werden
                        verschlüsselt gespeichert und sind nur für autorisierte
                        HR-Mitarbeiter sichtbar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={profile.bankAccount || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, bankAccount: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="DE89 3704 0044 0532 0130 00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BIC
                    </label>
                    <input
                      type="text"
                      value={profile.bic || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, bic: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="COBADEFFXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank-Name
                    </label>
                    <input
                      type="text"
                      value={profile.bankName || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, bankName: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Commerzbank"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notfallkontakt Tab */}
            {activeTab === 'notfall' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-xl">🚨</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">
                        <strong>Notfallkontakt:</strong> Diese Person wird im Notfall
                        kontaktiert. Bitte stellen Sie sicher, dass die Daten aktuell
                        sind.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profile.emergencyContactName || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContactName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Maria Mustermann"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefonnummer
                    </label>
                    <input
                      type="tel"
                      value={profile.emergencyContactPhone || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beziehung
                    </label>
                    <select
                      value={profile.emergencyContactRelation || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          emergencyContactRelation: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="Ehepartner">Ehepartner/in</option>
                      <option value="Partner">Partner/in</option>
                      <option value="Eltern">Eltern</option>
                      <option value="Geschwister">Geschwister</option>
                      <option value="Kind">Kind</option>
                      <option value="Freund">Freund/in</option>
                      <option value="Sonstige">Sonstige</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {saving ? 'Speichere...' : '💾 Änderungen speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
