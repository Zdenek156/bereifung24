'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Car,
  Calendar,
  FileText,
  MessageSquare,
  Bell,
  Building2,
  Euro,
  TrendingUp,
  History,
  Upload,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'

interface Customer {
  id: string
  customerType: string
  firstName: string
  lastName: string
  companyName?: string
  salutation?: string
  email?: string
  phone?: string
  mobile?: string
  street?: string
  zipCode?: string
  city?: string
  country?: string
  totalBookings: number
  totalRevenue: number
  lastBookingDate?: string
  firstBookingDate?: string
  averageRating?: number
  source: string
  tags?: string
  segment?: string
  importance: string
  notes?: string
  createdAt: string
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  url: string
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'history' | 'documents'>(
    'overview'
  )
  
  // Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('09:00')
  const [reminderNotes, setReminderNotes] = useState('')
  const [savingReminder, setSavingReminder] = useState(false)
  
  // Documents State
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadingDocument, setUploadingDocument] = useState(false)

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
      if (activeTab === 'documents') {
        fetchDocuments()
      }
    }
  }, [customerId, activeTab])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/workshop/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/workshop/customers/${customerId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingDocument(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('customerId', customerId)

        const response = await fetch(`/api/workshop/customers/${customerId}/documents`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }
      }

      await fetchDocuments()
      alert('Dokument(e) erfolgreich hochgeladen!')
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Fehler beim Hochladen des Dokuments')
    } finally {
      setUploadingDocument(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCreateReminder = async () => {
    if (!reminderTitle || !reminderDate) {
      alert('Bitte Titel und Datum ausfüllen')
      return
    }

    setSavingReminder(true)
    try {
      const response = await fetch(`/api/workshop/customers/${customerId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reminderTitle,
          dueDate: `${reminderDate}T${reminderTime}:00`,
          notes: reminderNotes,
        }),
      })

      if (response.ok) {
        alert('Erinnerung erfolgreich erstellt!')
        setShowReminderModal(false)
        setReminderTitle('')
        setReminderDate('')
        setReminderTime('09:00')
        setReminderNotes('')
      } else {
        throw new Error('Failed to create reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      alert('Fehler beim Erstellen der Erinnerung')
    } finally {
      setSavingReminder(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getImportanceBadge = (importance: string) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800',
      HIGH: 'bg-orange-100 text-orange-800',
      NORMAL: 'bg-gray-100 text-gray-800',
      LOW: 'bg-blue-100 text-blue-800',
    }
    return colors[importance as keyof typeof colors] || colors.NORMAL
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'BEREIFUNG24_BOOKING':
        return 'Bereifung24 Buchung'
      case 'BEREIFUNG24_MANUAL_APPOINTMENT':
        return 'Manueller Termin'
      case 'MANUAL':
        return 'Manuell erstellt'
      default:
        return source
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

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <BackButton />
        <Card className="p-12 text-center mt-6">
          <h2 className="text-xl font-semibold mb-2">Kunde nicht gefunden</h2>
          <p className="text-gray-600 mb-4">
            Der angeforderte Kunde existiert nicht oder wurde gelöscht.
          </p>
          <Button onClick={() => router.push('/dashboard/workshop/customers')}>
            Zurück zur Übersicht
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {customer.customerType === 'BUSINESS' && customer.companyName
                  ? customer.companyName
                  : `${customer.firstName} ${customer.lastName}`}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceBadge(
                  customer.importance
                )}`}
              >
                {customer.importance}
              </span>
            </div>
            {customer.customerType === 'BUSINESS' && customer.companyName && (
              <p className="text-gray-600 mt-1">
                {customer.salutation} {customer.firstName} {customer.lastName}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Kunde seit {formatDate(customer.createdAt)} • {getSourceLabel(customer.source)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/workshop/customers/${customerId}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
          <Button 
            variant="outline" 
            className="text-red-600 hover:bg-red-50"
            onClick={async () => {
              if (!confirm('Möchten Sie diesen Kunden wirklich löschen?')) return
              try {
                const response = await fetch(`/api/workshop/customers/${customerId}`, {
                  method: 'DELETE'
                })
                if (response.ok) {
                  router.push('/dashboard/workshop/customers')
                }
              } catch (error) {
                console.error('Error deleting customer:', error)
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Buchungen</p>
              <p className="text-2xl font-bold">{customer.totalBookings}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Umsatz</p>
              <p className="text-2xl font-bold">{formatCurrency(customer.totalRevenue)}</p>
            </div>
            <Euro className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bewertung</p>
              <p className="text-2xl font-bold">
                {customer.averageRating
                  ? `${customer.averageRating.toFixed(1)} ⭐`
                  : '-'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Letzte Buchung</p>
              <p className="text-lg font-semibold">
                {formatDate(customer.lastBookingDate)}
              </p>
            </div>
            <History className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <User className="h-4 w-4" />
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`${
              activeTab === 'vehicles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Car className="h-4 w-4" />
            Fahrzeuge
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <History className="h-4 w-4" />
            Historie
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="h-4 w-4" />
            Dokumente
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kontaktdaten */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Kontaktdaten
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customer.email}
                      </a>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Telefon</p>
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                )}
                {customer.mobile && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Mobil</p>
                      <a
                        href={`tel:${customer.mobile}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customer.mobile}
                      </a>
                    </div>
                  </div>
                )}
                {(customer.street || customer.city) && (
                  <div className="flex items-start gap-3 col-span-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p>
                        {customer.street && <>{customer.street}<br /></>}
                        {customer.zipCode} {customer.city}
                        {customer.country && customer.country !== 'Deutschland' && (
                          <>, {customer.country}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {customer.customerType === 'BUSINESS' && (
                  <div className="flex items-start gap-3 col-span-2">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Firmentyp</p>
                      <p>Geschäftskunde</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {customer.notes && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notizen
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {customer.tags && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(customer.tags).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Schnellaktionen</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/workshop/create-appointment?customer=' + customerId)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Termin buchen
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `mailto:${customer.email}`}
                  disabled={!customer.email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email senden
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowReminderModal(true)}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Erinnerung erstellen
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <Card className="p-12 text-center">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fahrzeugverwaltung</h2>
          <p className="text-gray-600 mb-4">
            Hier werden die Fahrzeuge des Kunden angezeigt.
          </p>
          <Button 
            className="mt-2"
            onClick={() => router.push(`/dashboard/workshop/customers/${customerId}/add-vehicle`)}
          >
            <Car className="h-4 w-4 mr-2" />
            Erstes Fahrzeug hinzufügen
          </Button>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card className="p-12 text-center">
          <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Service-Historie</h2>
          <p className="text-gray-600">
            Hier wird die komplette Servicehistorie des Kunden angezeigt.
          </p>
        </Card>
      )}

      {activeTab === 'documents' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Dokumente</h2>
              <p className="text-sm text-gray-600 mt-1">
                Rechnungen, Fotos und andere Dokumente
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDocument}
              >
                {uploadingDocument ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Wird hochgeladen...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Dokument hochladen
                  </>
                )}
              </Button>
            </div>
          </div>

          {documents.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Keine Dokumente</h2>
              <p className="text-gray-600 mb-4">
                Es wurden noch keine Dokumente hochgeladen.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(doc.size / 1024).toFixed(1)} KB •{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      Öffnen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm('Dokument wirklich löschen?')) return
                        try {
                          await fetch(`/api/workshop/customers/${customerId}/documents/${doc.id}`, {
                            method: 'DELETE'
                          })
                          fetchDocuments()
                        } catch (error) {
                          alert('Fehler beim Löschen')
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Erinnerung erstellen</h2>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Reifenwechsel anbieten"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReminderModal(false)}
              >
                Abbrechen
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateReminder}
                disabled={savingReminder}
              >
                {savingReminder ? 'Speichert...' : 'Erstellen'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
