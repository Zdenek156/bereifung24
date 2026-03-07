'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Building2, ChevronLeft, Edit, Globe, Loader2, Mail,
  Phone, PlusCircle, Save, Search, Settings, Trash2, User, Users,
  Link2, Gift, FileText, Wrench, ToggleLeft, ToggleRight, Star, X,
  Copy, Check, Send, Eye,
} from 'lucide-react'
import BackButton from '@/components/BackButton'

// ===================== TYPES =====================

interface SupplierListItem {
  id: string
  code: string
  companyName: string
  category: string
  isActive: boolean
  phone: string | null
  email: string | null
  city: string | null
  _count: { contacts: number; emailTemplates: number }
  apiConfig: { apiMode: string } | null
  referralProgram: { isActive: boolean } | null
  workshopCount: number
}

interface SupplierDetail {
  id: string
  code: string
  companyName: string
  legalForm: string | null
  category: string
  website: string | null
  street: string | null
  zipCode: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  taxId: string | null
  customerNumber: string | null
  isActive: boolean
  notes: string | null
  contacts: Contact[]
  apiConfig: ApiConfig | null
  referralProgram: ReferralProgram | null
  emailTemplates: EmailTemplate[]
  workshopConnections: WorkshopConnection[]
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  position: string | null
  purposes: string[]
  isPrimary: boolean
  notes: string | null
}

interface ApiConfig {
  id: string
  apiMode: string
  apiEndpoint: string | null
  apiTestEndpoint: string | null
  authType: string | null
  apiUsername: string | null
  apiPassword: string | null
  apiKey: string | null
  csvDownloadUrl: string | null
  csvFormat: string | null
  csvAutoUpdate: boolean
  csvUpdateSchedule: string | null
  lastApiCheck: string | null
  lastApiError: string | null
  lastCsvImport: string | null
}

interface ReferralProgram {
  id: string
  isActive: boolean
  referralCode: string | null
  registrationLink: string | null
  bonusPerNewCustomer: number | null
  bonusForReferred: number | null
  conditions: string | null
  validFrom: string | null
  validUntil: string | null
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  bodyHtml: string
  description: string | null
  isActive: boolean
}

interface WorkshopConnection {
  id: string
  supplier: string
  connectionType: string
  isActive: boolean
  autoOrder: boolean
  connectionStatus: string
  createdAt: string
  workshop: {
    id: string
    companyName: string
    city: string | null
    zipCode: string | null
  }
}

// ===================== CONSTANTS =====================

const CATEGORIES = [
  { value: 'REIFENGROSSHANDEL', label: 'Reifengroßhandel' },
  { value: 'RDKS', label: 'RDKS' },
  { value: 'FELGEN', label: 'Felgen' },
  { value: 'SONSTIGES', label: 'Sonstiges' },
]

const CONTACT_PURPOSES = [
  { value: 'API', label: 'API-Anfragen' },
  { value: 'VERTRIEB', label: 'Vertrieb/Partnerschaft' },
  { value: 'SUPPORT', label: 'Technischer Support' },
  { value: 'BUCHHALTUNG', label: 'Buchhaltung' },
  { value: 'ALLGEMEIN', label: 'Allgemein' },
]

const API_MODES = [
  { value: 'NONE', label: 'Keiner' },
  { value: 'TEST', label: 'Test' },
  { value: 'LIVE', label: 'Live' },
]

const AUTH_TYPES = [
  { value: 'BASIC', label: 'Basic Auth' },
  { value: 'BEARER', label: 'Bearer Token' },
  { value: 'API_KEY', label: 'API Key' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
]

const CONNECTION_STATUSES: Record<string, { label: string; color: string }> = {
  ANGEFRAGT: { label: 'Angefragt', color: 'bg-yellow-100 text-yellow-800' },
  TEST: { label: 'Test', color: 'bg-blue-100 text-blue-800' },
  LIVE: { label: 'Live', color: 'bg-green-100 text-green-800' },
  ABGELEHNT: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800' },
}

const TEMPLATE_PLACEHOLDERS = [
  { key: '{workshop_name}', label: 'Werkstattname' },
  { key: '{workshop_email}', label: 'Werkstatt-E-Mail' },
  { key: '{workshop_phone}', label: 'Werkstatt-Telefon' },
  { key: '{workshop_contact_person}', label: 'Ansprechpartner Werkstatt' },
  { key: '{supplier_customer_number}', label: 'Kundennummer beim Lieferanten' },
  { key: '{b24_contact_name}', label: 'B24 Kontaktperson' },
  { key: '{b24_contact_email}', label: 'B24 E-Mail' },
  { key: '{referral_code}', label: 'Empfehlungscode' },
  { key: '{registration_url}', label: 'Registrierungs-URL' },
]

// ===================== MAIN COMPONENT =====================

export default function SupplierManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // State
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list')
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [activeTab, setActiveTab] = useState('stammdaten')

  // Redirect if not authorized
  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'B24_EMPLOYEE')) {
      router.push('/admin')
    }
  }, [session, status, router])

  // Load suppliers list
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/supplier-management')
      if (res.ok) {
        setSuppliers(await res.json())
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user && (session.user.role === 'ADMIN' || session.user.role === 'B24_EMPLOYEE')) {
      loadSuppliers()
    }
  }, [session, loadSuppliers])

  // Load supplier detail
  const loadSupplierDetail = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/supplier-management/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedSupplier(data)
        setView('detail')
        setActiveTab('stammdaten')
      }
    } catch (error) {
      console.error('Error loading supplier:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToList = () => {
    setView('list')
    setSelectedSupplier(null)
    loadSuppliers()
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchSearch = !searchTerm ||
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchCategory = !filterCategory || s.category === filterCategory
    return matchSearch && matchCategory
  })

  if (status === 'loading' || (loading && view === 'list' && suppliers.length === 0)) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {view === 'list' && (
        <SupplierListView
          suppliers={filteredSuppliers}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          onSelect={loadSupplierDetail}
          onCreate={() => setView('create')}
          isAdmin={isAdmin}
          loading={loading}
        />
      )}
      {view === 'create' && (
        <CreateSupplierView
          onBack={goToList}
          onCreated={(id) => loadSupplierDetail(id)}
        />
      )}
      {view === 'detail' && selectedSupplier && (
        <SupplierDetailView
          supplier={selectedSupplier}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={goToList}
          onRefresh={() => loadSupplierDetail(selectedSupplier.id)}
          isAdmin={isAdmin}
          saving={saving}
          setSaving={setSaving}
        />
      )}
    </div>
  )
}

// ===================== LIST VIEW =====================

function SupplierListView({
  suppliers, searchTerm, setSearchTerm, filterCategory, setFilterCategory,
  onSelect, onCreate, isAdmin, loading,
}: {
  suppliers: SupplierListItem[]
  searchTerm: string
  setSearchTerm: (v: string) => void
  filterCategory: string
  setFilterCategory: (v: string) => void
  onSelect: (id: string) => void
  onCreate: () => void
  isAdmin: boolean
  loading: boolean
}) {
  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      REIFENGROSSHANDEL: 'bg-blue-100 text-blue-800',
      RDKS: 'bg-purple-100 text-purple-800',
      FELGEN: 'bg-orange-100 text-orange-800',
      SONSTIGES: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      REIFENGROSSHANDEL: 'Reifengroßhandel',
      RDKS: 'RDKS',
      FELGEN: 'Felgen',
      SONSTIGES: 'Sonstiges',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[cat] || colors.SONSTIGES}`}>
        {labels[cat] || cat}
      </span>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lieferantenverwaltung</h1>
            <p className="text-sm text-gray-500 mt-1">
              {suppliers.length} Lieferant{suppliers.length !== 1 ? 'en' : ''} gesamt
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={onCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Neuen Lieferanten anlegen
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Suche nach Name, Code oder Stadt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Alle Kategorien</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lieferant</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>API</TableHead>
                <TableHead>Kontakte</TableHead>
                <TableHead>Werkstätten</TableHead>
                <TableHead>Empfehlung</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Keine Lieferanten gefunden
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map(s => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSelect(s.id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{s.companyName}</div>
                        <div className="text-xs text-gray-500">{s.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(s.category)}</TableCell>
                    <TableCell>
                      {s.apiConfig?.apiMode === 'LIVE' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Live</Badge>
                      ) : s.apiConfig?.apiMode === 'TEST' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Test</Badge>
                      ) : (
                        <Badge variant="outline">Keiner</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s._count.contacts}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s.workshopCount}</span>
                    </TableCell>
                    <TableCell>
                      {s.referralProgram?.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktiv</Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full" /> Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                          <span className="w-2 h-2 bg-gray-300 rounded-full" /> Inaktiv
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

// ===================== CREATE VIEW =====================

function CreateSupplierView({
  onBack, onCreated,
}: {
  onBack: () => void
  onCreated: (id: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '', companyName: '', legalForm: '', category: 'REIFENGROSSHANDEL',
    website: '', street: '', zipCode: '', city: '', country: 'Deutschland',
    phone: '', email: '', taxId: '', customerNumber: '', notes: '',
  })

  const handleSave = async () => {
    setError('')
    if (!form.code || !form.companyName) {
      setError('Code und Firmenname sind erforderlich')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/supplier-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        onCreated(data.id)
      } else {
        const err = await res.json()
        setError(err.error || 'Fehler beim Erstellen')
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Neuen Lieferanten anlegen</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
          <CardDescription>Grundlegende Informationen zum Lieferanten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="z.B. TYRESYSTEM"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Eindeutiger Kurzcode (wird in Großbuchstaben gespeichert)</p>
            </div>
            <div>
              <Label>Firmenname *</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder="z.B. TyreSystem GmbH"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rechtsform</Label>
              <Input
                value={form.legalForm}
                onChange={(e) => setForm(f => ({ ...f, legalForm: e.target.value }))}
                placeholder="z.B. GmbH"
              />
            </div>
            <div>
              <Label>Kategorie</Label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Adresse & Kontakt</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Straße</Label>
                <Input value={form.street} onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>PLZ</Label>
                  <Input value={form.zipCode} onChange={(e) => setForm(f => ({ ...f, zipCode: e.target.value }))} />
                </div>
                <div>
                  <Label>Stadt</Label>
                  <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>E-Mail</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" />
              </div>
              <div>
                <Label>Land</Label>
                <Input value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Geschäftsdaten</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>USt-IdNr.</Label>
                <Input value={form.taxId} onChange={(e) => setForm(f => ({ ...f, taxId: e.target.value }))} placeholder="DE123456789" />
              </div>
              <div>
                <Label>Unsere Kundennummer</Label>
                <Input value={form.customerNumber} onChange={(e) => setForm(f => ({ ...f, customerNumber: e.target.value }))} />
              </div>
            </div>
          </div>

          <div>
            <Label>Notizen</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onBack}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Lieferant anlegen
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ===================== DETAIL VIEW =====================

function SupplierDetailView({
  supplier, activeTab, setActiveTab, onBack, onRefresh, isAdmin, saving, setSaving,
}: {
  supplier: SupplierDetail
  activeTab: string
  setActiveTab: (v: string) => void
  onBack: () => void
  onRefresh: () => void
  isAdmin: boolean
  saving: boolean
  setSaving: (v: boolean) => void
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.companyName}</h1>
            <p className="text-sm text-gray-500 font-mono">{supplier.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {supplier.isActive ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktiv</Badge>
          ) : (
            <Badge variant="outline">Inaktiv</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="stammdaten" className="text-xs">
            <Building2 className="w-3.5 h-3.5 mr-1" /> Stammdaten
          </TabsTrigger>
          <TabsTrigger value="kontakte" className="text-xs">
            <Users className="w-3.5 h-3.5 mr-1" /> Ansprechpartner
          </TabsTrigger>
          <TabsTrigger value="schnittstellen" className="text-xs">
            <Settings className="w-3.5 h-3.5 mr-1" /> Schnittstellen
          </TabsTrigger>
          <TabsTrigger value="empfehlung" className="text-xs">
            <Gift className="w-3.5 h-3.5 mr-1" /> Empfehlung
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" /> E-Mail-Templates
          </TabsTrigger>
          <TabsTrigger value="werkstaetten" className="text-xs">
            <Wrench className="w-3.5 h-3.5 mr-1" /> Werkstätten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten">
          <StammdatenTab supplier={supplier} isAdmin={isAdmin} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="kontakte">
          <KontakteTab supplier={supplier} isAdmin={isAdmin} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="schnittstellen">
          <SchnittstellenTab supplier={supplier} isAdmin={isAdmin} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="empfehlung">
          <EmpfehlungTab supplier={supplier} isAdmin={isAdmin} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab supplier={supplier} isAdmin={isAdmin} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="werkstaetten">
          <WerkstaettenTab supplier={supplier} />
        </TabsContent>
      </Tabs>
    </>
  )
}

// ===================== TAB 1: STAMMDATEN =====================

function StammdatenTab({ supplier, isAdmin, onRefresh }: { supplier: SupplierDetail; isAdmin: boolean; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    companyName: supplier.companyName,
    legalForm: supplier.legalForm || '',
    category: supplier.category,
    website: supplier.website || '',
    street: supplier.street || '',
    zipCode: supplier.zipCode || '',
    city: supplier.city || '',
    country: supplier.country,
    phone: supplier.phone || '',
    email: supplier.email || '',
    taxId: supplier.taxId || '',
    customerNumber: supplier.customerNumber || '',
    notes: supplier.notes || '',
    isActive: supplier.isActive,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/supplier-management/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEditing(false)
        onRefresh()
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stammdaten</CardTitle>
            <CardDescription>Firmeninformationen und Kontaktdaten</CardDescription>
          </div>
          {isAdmin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-1" /> Bearbeiten
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Firmenname</Label>
                <Input value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div>
                <Label>Rechtsform</Label>
                <Input value={form.legalForm} onChange={(e) => setForm(f => ({ ...f, legalForm: e.target.value }))} />
              </div>
              <div>
                <Label>Kategorie</Label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div>
                <Label>Straße</Label>
                <Input value={form.street} onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>PLZ</Label>
                  <Input value={form.zipCode} onChange={(e) => setForm(f => ({ ...f, zipCode: e.target.value }))} />
                </div>
                <div>
                  <Label>Stadt</Label>
                  <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>E-Mail</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              </div>
              <div>
                <Label>USt-IdNr.</Label>
                <Input value={form.taxId} onChange={(e) => setForm(f => ({ ...f, taxId: e.target.value }))} />
              </div>
              <div>
                <Label>Unsere Kundennummer</Label>
                <Input value={form.customerNumber} onChange={(e) => setForm(f => ({ ...f, customerNumber: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Label>Status:</Label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
              >
                {form.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.isActive ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow label="Firmenname" value={supplier.companyName} />
              <InfoRow label="Rechtsform" value={supplier.legalForm} />
              <InfoRow label="Kategorie" value={CATEGORIES.find(c => c.value === supplier.category)?.label || supplier.category} />
              <InfoRow label="Website" value={supplier.website} isLink />
              <InfoRow label="Straße" value={supplier.street} />
              <InfoRow label="PLZ / Stadt" value={[supplier.zipCode, supplier.city].filter(Boolean).join(' ') || null} />
              <InfoRow label="Telefon" value={supplier.phone} />
              <InfoRow label="E-Mail" value={supplier.email} />
              <InfoRow label="USt-IdNr." value={supplier.taxId} />
              <InfoRow label="Unsere Kundennummer" value={supplier.customerNumber} />
            </div>
            {supplier.notes && (
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wide">Notizen</Label>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value, isLink }: { label: string; value: string | null; isLink?: boolean }) {
  return (
    <div>
      <Label className="text-gray-500 text-xs uppercase tracking-wide">{label}</Label>
      {value ? (
        isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline mt-0.5">
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-900 mt-0.5">{value}</p>
        )
      ) : (
        <p className="text-sm text-gray-400 mt-0.5">—</p>
      )}
    </div>
  )
}

// ===================== TAB 2: KONTAKTE =====================

function KontakteTab({ supplier, isAdmin, onRefresh }: { supplier: SupplierDetail; isAdmin: boolean; onRefresh: () => void }) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', position: '',
    purposes: [] as string[], isPrimary: false, notes: '',
  })

  const openCreate = () => {
    setEditingContact(null)
    setForm({ firstName: '', lastName: '', email: '', phone: '', position: '', purposes: [], isPrimary: false, notes: '' })
    setShowDialog(true)
  }

  const openEdit = (c: Contact) => {
    setEditingContact(c)
    setForm({
      firstName: c.firstName, lastName: c.lastName, email: c.email || '',
      phone: c.phone || '', position: c.position || '', purposes: c.purposes || [],
      isPrimary: c.isPrimary, notes: c.notes || '',
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingContact
        ? `/api/admin/supplier-management/${supplier.id}/contacts/${editingContact.id}`
        : `/api/admin/supplier-management/${supplier.id}/contacts`
      const res = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowDialog(false)
        onRefresh()
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!confirm('Kontakt wirklich löschen?')) return
    try {
      await fetch(`/api/admin/supplier-management/${supplier.id}/contacts/${contactId}`, { method: 'DELETE' })
      onRefresh()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const togglePurpose = (p: string) => {
    setForm(f => ({
      ...f,
      purposes: f.purposes.includes(p) ? f.purposes.filter(x => x !== p) : [...f.purposes, p],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ansprechpartner</CardTitle>
            <CardDescription>{supplier.contacts.length} Kontakt{supplier.contacts.length !== 1 ? 'e' : ''}</CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <PlusCircle className="w-4 h-4 mr-1" /> Kontakt hinzufügen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {supplier.contacts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Noch keine Kontakte angelegt</p>
        ) : (
          <div className="space-y-3">
            {supplier.contacts.map(c => (
              <div key={c.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.firstName} {c.lastName}</span>
                        {c.isPrimary && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Hauptkontakt</Badge>}
                      </div>
                      {c.position && <p className="text-sm text-gray-500">{c.position}</p>}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {c.email && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="w-3 h-3" /> {c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3 h-3" /> {c.phone}
                          </span>
                        )}
                      </div>
                      {c.purposes && c.purposes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.purposes.map(p => (
                            <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {CONTACT_PURPOSES.find(cp => cp.value === p)?.label || p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Contact Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vorname *</Label>
                <Input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Nachname *</Label>
                <Input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>E-Mail</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Position</Label>
              <Input value={form.position} onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} placeholder="z.B. Vertriebsleiter" />
            </div>
            <div>
              <Label>Zuständigkeiten</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CONTACT_PURPOSES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePurpose(p.value)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      form.purposes.includes(p.value)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={(e) => setForm(f => ({ ...f, isPrimary: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isPrimary" className="font-normal">Hauptkontakt</Label>
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.firstName || !form.lastName}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingContact ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ===================== TAB 3: SCHNITTSTELLEN =====================

function SchnittstellenTab({ supplier, isAdmin, onRefresh }: { supplier: SupplierDetail; isAdmin: boolean; onRefresh: () => void }) {
  const config = supplier.apiConfig
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    apiMode: config?.apiMode || 'NONE',
    apiEndpoint: config?.apiEndpoint || '',
    apiTestEndpoint: config?.apiTestEndpoint || '',
    authType: config?.authType || 'BASIC',
    apiUsername: config?.apiUsername || '',
    apiPassword: config?.apiPassword || '',
    apiKey: config?.apiKey || '',
    csvDownloadUrl: config?.csvDownloadUrl || '',
    csvFormat: config?.csvFormat || '',
    csvAutoUpdate: config?.csvAutoUpdate || false,
    csvUpdateSchedule: config?.csvUpdateSchedule || 'WEEKLY',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/supplier-management/${supplier.id}/api-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEditing(false)
        onRefresh()
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schnittstellen-Konfiguration</CardTitle>
            <CardDescription>API- und CSV-Einstellungen für diesen Lieferanten</CardDescription>
          </div>
          {isAdmin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-1" /> Bearbeiten
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-6">
            {/* API Mode */}
            <div>
              <Label className="text-base font-medium">API-Modus</Label>
              <div className="flex gap-3 mt-2">
                {API_MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, apiMode: m.value }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.apiMode === m.value
                        ? m.value === 'LIVE' ? 'bg-green-100 border-green-300 text-green-800'
                          : m.value === 'TEST' ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                            : 'bg-gray-100 border-gray-300 text-gray-800'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Settings (only when mode != NONE) */}
            {form.apiMode !== 'NONE' && (
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <h4 className="font-medium">API-Einstellungen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Live-Endpoint</Label>
                    <Input value={form.apiEndpoint} onChange={(e) => setForm(f => ({ ...f, apiEndpoint: e.target.value }))} placeholder="https://api.example.com/Rest" />
                  </div>
                  <div>
                    <Label>Test-Endpoint</Label>
                    <Input value={form.apiTestEndpoint} onChange={(e) => setForm(f => ({ ...f, apiTestEndpoint: e.target.value }))} placeholder="https://test-api.example.com/Rest" />
                  </div>
                </div>
                <div>
                  <Label>Auth-Typ</Label>
                  <select value={form.authType} onChange={(e) => setForm(f => ({ ...f, authType: e.target.value }))} className="w-full border rounded-md px-3 py-2 text-sm">
                    {AUTH_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                {(form.authType === 'BASIC') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Benutzername</Label>
                      <Input value={form.apiUsername} onChange={(e) => setForm(f => ({ ...f, apiUsername: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Passwort</Label>
                      <Input value={form.apiPassword} onChange={(e) => setForm(f => ({ ...f, apiPassword: e.target.value }))} type="password" />
                    </div>
                  </div>
                )}
                {(form.authType === 'BEARER' || form.authType === 'API_KEY') && (
                  <div>
                    <Label>API Key / Token</Label>
                    <Input value={form.apiKey} onChange={(e) => setForm(f => ({ ...f, apiKey: e.target.value }))} type="password" />
                  </div>
                )}
              </div>
            )}

            {/* CSV Settings */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">CSV-Import</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Download-URL</Label>
                  <Input value={form.csvDownloadUrl} onChange={(e) => setForm(f => ({ ...f, csvDownloadUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <Label>Format</Label>
                  <Input value={form.csvFormat} onChange={(e) => setForm(f => ({ ...f, csvFormat: e.target.value }))} placeholder="TYRESYSTEM, CUSTOM" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="csvAutoUpdate"
                    checked={form.csvAutoUpdate}
                    onChange={(e) => setForm(f => ({ ...f, csvAutoUpdate: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="csvAutoUpdate" className="font-normal">Automatische Aktualisierung</Label>
                </div>
                {form.csvAutoUpdate && (
                  <select value={form.csvUpdateSchedule} onChange={(e) => setForm(f => ({ ...f, csvUpdateSchedule: e.target.value }))} className="border rounded-md px-3 py-1 text-sm">
                    <option value="DAILY">Täglich</option>
                    <option value="WEEKLY">Wöchentlich</option>
                    <option value="MONTHLY">Monatlich</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label className="text-gray-500 text-xs uppercase tracking-wide">API-Modus</Label>
              <div className="mt-1">
                {config?.apiMode === 'LIVE' ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Live</Badge>
                ) : config?.apiMode === 'TEST' ? (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Test</Badge>
                ) : (
                  <Badge variant="outline">Keiner</Badge>
                )}
              </div>
            </div>

            {config?.apiMode !== 'NONE' && config?.apiEndpoint && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="Live-Endpoint" value={config.apiEndpoint} />
                <InfoRow label="Test-Endpoint" value={config.apiTestEndpoint} />
                <InfoRow label="Auth-Typ" value={AUTH_TYPES.find(a => a.value === config.authType)?.label || config.authType} />
                <InfoRow label="Benutzername" value={config.apiUsername} />
                {config.lastApiCheck && (
                  <InfoRow label="Letzte API-Prüfung" value={new Date(config.lastApiCheck).toLocaleString('de-DE')} />
                )}
                {config.lastApiError && (
                  <div>
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Letzter Fehler</Label>
                    <p className="text-sm text-red-600 mt-0.5">{config.lastApiError}</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">CSV-Import</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="Download-URL" value={config?.csvDownloadUrl} isLink />
                <InfoRow label="Format" value={config?.csvFormat} />
                <InfoRow label="Auto-Update" value={config?.csvAutoUpdate ? `Ja (${config.csvUpdateSchedule || 'WEEKLY'})` : 'Nein'} />
                {config?.lastCsvImport && (
                  <InfoRow label="Letzter Import" value={new Date(config.lastCsvImport).toLocaleString('de-DE')} />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ===================== TAB 4: EMPFEHLUNGSPROGRAMM =====================

function EmpfehlungTab({ supplier, isAdmin, onRefresh }: { supplier: SupplierDetail; isAdmin: boolean; onRefresh: () => void }) {
  const prog = supplier.referralProgram
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    isActive: prog?.isActive || false,
    referralCode: prog?.referralCode || '',
    registrationLink: prog?.registrationLink || '',
    bonusPerNewCustomer: prog?.bonusPerNewCustomer?.toString() || '',
    bonusForReferred: prog?.bonusForReferred?.toString() || '',
    conditions: prog?.conditions || '',
    validFrom: prog?.validFrom ? prog.validFrom.slice(0, 10) : '',
    validUntil: prog?.validUntil ? prog.validUntil.slice(0, 10) : '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/supplier-management/${supplier.id}/referral`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEditing(false)
        onRefresh()
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Empfehlungsprogramm</CardTitle>
            <CardDescription>Referral-Programm für Werkstatt-Neukundengewinnung</CardDescription>
          </div>
          {isAdmin && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-1" /> Bearbeiten
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label>Status:</Label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
              >
                {form.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {form.isActive ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Empfehlungscode</Label>
                <Input value={form.referralCode} onChange={(e) => setForm(f => ({ ...f, referralCode: e.target.value }))} placeholder="z.B. B24-REF" />
              </div>
              <div>
                <Label>Registrierungs-Link</Label>
                <Input value={form.registrationLink} onChange={(e) => setForm(f => ({ ...f, registrationLink: e.target.value }))} placeholder="https://...?ref={referral_code}" />
                <p className="text-xs text-gray-500 mt-1">Nutze {'{referral_code}'} als Platzhalter</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prämie pro Neukunde (€)</Label>
                <Input value={form.bonusPerNewCustomer} onChange={(e) => setForm(f => ({ ...f, bonusPerNewCustomer: e.target.value }))} type="number" step="0.01" />
              </div>
              <div>
                <Label>Prämie für Geworbenen (€)</Label>
                <Input value={form.bonusForReferred} onChange={(e) => setForm(f => ({ ...f, bonusForReferred: e.target.value }))} type="number" step="0.01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gültig ab</Label>
                <Input value={form.validFrom} onChange={(e) => setForm(f => ({ ...f, validFrom: e.target.value }))} type="date" />
              </div>
              <div>
                <Label>Gültig bis</Label>
                <Input value={form.validUntil} onChange={(e) => setForm(f => ({ ...f, validUntil: e.target.value }))} type="date" />
              </div>
            </div>
            <div>
              <Label>Bedingungen</Label>
              <Textarea value={form.conditions} onChange={(e) => setForm(f => ({ ...f, conditions: e.target.value }))} rows={4} placeholder="Freitext: Bedingungen des Empfehlungsprogramms..." />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Status</Label>
              <div className="mt-1">
                {prog?.isActive ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktiv</Badge>
                ) : (
                  <Badge variant="outline">Inaktiv</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow label="Empfehlungscode" value={prog?.referralCode} />
              <InfoRow label="Registrierungs-Link" value={prog?.registrationLink} isLink />
              <InfoRow label="Prämie pro Neukunde" value={prog?.bonusPerNewCustomer ? `${prog.bonusPerNewCustomer.toFixed(2)} €` : null} />
              <InfoRow label="Prämie für Geworbenen" value={prog?.bonusForReferred ? `${prog.bonusForReferred.toFixed(2)} €` : null} />
              <InfoRow label="Gültig ab" value={prog?.validFrom ? new Date(prog.validFrom).toLocaleDateString('de-DE') : null} />
              <InfoRow label="Gültig bis" value={prog?.validUntil ? new Date(prog.validUntil).toLocaleDateString('de-DE') : null} />
            </div>
            {prog?.conditions && (
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wide">Bedingungen</Label>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{prog.conditions}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ===================== TAB 5: EMAIL TEMPLATES =====================

function TemplatesTab({ supplier, isAdmin, onRefresh }: { supplier: SupplierDetail; isAdmin: boolean; onRefresh: () => void }) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', subject: '', bodyHtml: '', description: '', isActive: true,
  })

  // Send email state
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(null)
  const [sending, setSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [recipientType, setRecipientType] = useState<'contact' | 'workshop' | 'custom'>('custom')
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('')
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  const openCreate = () => {
    setEditingTemplate(null)
    setForm({ name: '', subject: '', bodyHtml: '', description: '', isActive: true })
    setShowDialog(true)
  }

  const openEdit = (t: EmailTemplate) => {
    setEditingTemplate(t)
    setForm({
      name: t.name, subject: t.subject, bodyHtml: t.bodyHtml,
      description: t.description || '', isActive: t.isActive,
    })
    setShowDialog(true)
  }

  const openSend = (t: EmailTemplate) => {
    setSendingTemplate(t)
    setSendSuccess(false)
    setSendError(null)
    setRecipientType('custom')
    setSelectedContactId('')
    setSelectedWorkshopId('')
    setCustomEmail('')
    setCustomName('')
    setCustomValues({})
    setShowSendDialog(true)
  }

  const openPreview = (t: EmailTemplate) => {
    setPreviewTemplate(t)
    setShowPreview(true)
  }

  const getRecipientEmail = (): string => {
    if (recipientType === 'contact' && selectedContactId) {
      const contact = supplier.contacts.find(c => c.id === selectedContactId)
      return contact?.email || ''
    }
    if (recipientType === 'workshop' && selectedWorkshopId) {
      const wc = supplier.workshopConnections.find(c => c.workshop.id === selectedWorkshopId)
      // Workshop email will be resolved server-side
      return wc ? `workshop:${wc.workshop.id}` : ''
    }
    return customEmail
  }

  const getRecipientName = (): string => {
    if (recipientType === 'contact' && selectedContactId) {
      const contact = supplier.contacts.find(c => c.id === selectedContactId)
      return contact ? `${contact.firstName} ${contact.lastName}` : ''
    }
    if (recipientType === 'workshop' && selectedWorkshopId) {
      const wc = supplier.workshopConnections.find(c => c.workshop.id === selectedWorkshopId)
      return wc?.workshop.companyName || ''
    }
    return customName
  }

  const handleSend = async () => {
    if (!sendingTemplate) return

    let email = ''
    let name = ''
    let workshopId: string | undefined

    if (recipientType === 'contact' && selectedContactId) {
      const contact = supplier.contacts.find(c => c.id === selectedContactId)
      if (!contact?.email) { setSendError('Ausgewählter Kontakt hat keine E-Mail-Adresse'); return }
      email = contact.email
      name = `${contact.firstName} ${contact.lastName}`
    } else if (recipientType === 'workshop' && selectedWorkshopId) {
      const wc = supplier.workshopConnections.find(c => c.workshop.id === selectedWorkshopId)
      if (!wc) { setSendError('Werkstatt nicht gefunden'); return }
      workshopId = wc.workshop.id
      // Use custom email for the workshop (user enters which email to send to)
      if (!customEmail) { setSendError('Bitte E-Mail-Adresse für die Werkstatt eingeben'); return }
      email = customEmail
      name = wc.workshop.companyName
    } else {
      if (!customEmail) { setSendError('Bitte E-Mail-Adresse eingeben'); return }
      email = customEmail
      name = customName
    }

    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(
        `/api/admin/supplier-management/${supplier.id}/templates/${sendingTemplate.id}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: email,
            recipientName: name,
            workshopId,
            customValues,
          }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        setSendSuccess(true)
      } else {
        setSendError(data.error || 'Fehler beim Senden')
      }
    } catch (error) {
      setSendError('Netzwerkfehler beim Senden')
    } finally {
      setSending(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingTemplate
        ? `/api/admin/supplier-management/${supplier.id}/templates/${editingTemplate.id}`
        : `/api/admin/supplier-management/${supplier.id}/templates`
      const res = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowDialog(false)
        onRefresh()
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Template wirklich löschen?')) return
    try {
      await fetch(`/api/admin/supplier-management/${supplier.id}/templates/${templateId}`, { method: 'DELETE' })
      onRefresh()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const insertPlaceholder = (key: string) => {
    setForm(f => ({ ...f, bodyHtml: f.bodyHtml + key }))
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const contactsWithEmail = supplier.contacts.filter(c => c.email)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>E-Mail-Templates</CardTitle>
            <CardDescription>{supplier.emailTemplates.length} Template{supplier.emailTemplates.length !== 1 ? 's' : ''}</CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <PlusCircle className="w-4 h-4 mr-1" /> Template erstellen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {supplier.emailTemplates.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Noch keine Templates angelegt</p>
        ) : (
          <div className="space-y-3">
            {supplier.emailTemplates.map(t => (
              <div key={t.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Aktiv</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Betreff: {t.subject}</p>
                    {t.description && <p className="text-xs text-gray-400 mt-1">{t.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openPreview(t)} title="Vorschau">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openSend(t)} className="text-blue-600 hover:text-blue-700" title="Senden">
                      <Send className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)} title="Bearbeiten">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-700" title="Löschen">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Template Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Template bearbeiten' : 'Neues Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Erstregistrierung" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Interne Beschreibung" />
              </div>
            </div>
            <div>
              <Label>Betreff *</Label>
              <Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="E-Mail Betreffzeile" />
            </div>

            {/* Placeholder chips */}
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Platzhalter (klicken zum Einfügen):</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_PLACEHOLDERS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => insertPlaceholder(p.key)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                  >
                    {copied === p.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {p.key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>HTML-Inhalt *</Label>
              <Textarea
                value={form.bodyHtml}
                onChange={(e) => setForm(f => ({ ...f, bodyHtml: e.target.value }))}
                rows={12}
                className="font-mono text-sm"
                placeholder="<p>Sehr geehrte(r) {workshop_contact_person},</p>..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="templateActive"
                checked={form.isActive}
                onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="templateActive" className="font-normal">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.subject || !form.bodyHtml}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingTemplate ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> E-Mail senden
            </DialogTitle>
            <DialogDescription>
              Template: <strong>{sendingTemplate?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {sendSuccess ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-lg font-medium text-green-800">E-Mail erfolgreich gesendet!</p>
              <p className="text-sm text-gray-500 mt-1">
                An: {recipientType === 'contact' && selectedContactId
                  ? supplier.contacts.find(c => c.id === selectedContactId)?.email
                  : customEmail}
              </p>
              <Button className="mt-4" onClick={() => setShowSendDialog(false)}>Schließen</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {/* Recipient type selector */}
                <div>
                  <Label className="mb-2 block">Empfänger wählen</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={recipientType === 'contact' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRecipientType('contact')}
                      disabled={contactsWithEmail.length === 0}
                    >
                      <User className="w-3.5 h-3.5 mr-1" /> Kontakt
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === 'workshop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRecipientType('workshop')}
                      disabled={(supplier.workshopConnections || []).length === 0}
                    >
                      <Wrench className="w-3.5 h-3.5 mr-1" /> Werkstatt
                    </Button>
                    <Button
                      type="button"
                      variant={recipientType === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRecipientType('custom')}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" /> Manuell
                    </Button>
                  </div>
                </div>

                {/* Contact selector */}
                {recipientType === 'contact' && (
                  <div>
                    <Label>Kontakt auswählen</Label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                    >
                      <option value="">-- Kontakt wählen --</option>
                      {contactsWithEmail.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} ({c.email}) {c.isPrimary ? '⭐' : ''} {c.position ? `– ${c.position}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Workshop selector */}
                {recipientType === 'workshop' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Werkstatt auswählen</Label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                        value={selectedWorkshopId}
                        onChange={(e) => setSelectedWorkshopId(e.target.value)}
                      >
                        <option value="">-- Werkstatt wählen --</option>
                        {(supplier.workshopConnections || []).map(c => (
                          <option key={c.workshop.id} value={c.workshop.id}>
                            {c.workshop.companyName} {c.workshop.city ? `(${c.workshop.zipCode} ${c.workshop.city})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>E-Mail-Adresse der Werkstatt *</Label>
                      <Input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="werkstatt@beispiel.de"
                      />
                      <p className="text-xs text-gray-400 mt-1">Die E-Mail-Adresse, an die gesendet werden soll</p>
                    </div>
                  </div>
                )}

                {/* Custom email */}
                {recipientType === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <Label>E-Mail-Adresse *</Label>
                      <Input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="empfaenger@beispiel.de"
                      />
                    </div>
                    <div>
                      <Label>Name (optional)</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Name des Empfängers"
                      />
                    </div>
                  </div>
                )}

                {/* Custom placeholder overrides */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Platzhalter-Werte (optional überschreiben):</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Kundennummer</label>
                      <Input
                        value={customValues.supplier_customer_number || ''}
                        onChange={(e) => setCustomValues(v => ({ ...v, supplier_customer_number: e.target.value }))}
                        placeholder="z.B. KD-12345"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Werkstattname</label>
                      <Input
                        value={customValues.workshop_name || ''}
                        onChange={(e) => setCustomValues(v => ({ ...v, workshop_name: e.target.value }))}
                        placeholder="Wird automatisch gefüllt"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {sendError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                    {sendError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>Abbrechen</Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || (recipientType === 'contact' && !selectedContactId) || (recipientType === 'custom' && !customEmail) || (recipientType === 'workshop' && (!selectedWorkshopId || !customEmail))}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  E-Mail senden
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vorschau: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>Betreff: {previewTemplate?.subject}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewTemplate?.bodyHtml || '' }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Schließen</Button>
            {previewTemplate && (
              <Button onClick={() => { setShowPreview(false); openSend(previewTemplate) }}>
                <Send className="w-4 h-4 mr-2" /> Senden
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ===================== TAB 6: WERKSTATT-ANBINDUNGEN =====================

function WerkstaettenTab({ supplier }: { supplier: SupplierDetail }) {
  const connections = supplier.workshopConnections || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Werkstatt-Anbindungen</CardTitle>
        <CardDescription>
          {connections.length} Werkstatt{connections.length !== 1 ? 'en' : ''} mit {supplier.companyName} verbunden
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Keine Werkstätten verbunden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Werkstatt</TableHead>
                <TableHead>Ort</TableHead>
                <TableHead>Anbindung</TableHead>
                <TableHead>Auto-Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map(c => {
                const statusInfo = CONNECTION_STATUSES[c.connectionStatus] || CONNECTION_STATUSES.LIVE
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="font-medium">{c.workshop.companyName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {[c.workshop.zipCode, c.workshop.city].filter(Boolean).join(' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.connectionType}</Badge>
                    </TableCell>
                    <TableCell>
                      {c.autoOrder ? (
                        <span className="text-green-600 text-sm">Ja</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Nein</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
