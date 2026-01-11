'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Mail, Building2, Activity, TrendingUp } from 'lucide-react'

const AVAILABLE_RESOURCES = [
  { value: 'workshops', label: 'Werkstattverwaltung' },
  { value: 'customers', label: 'Kundenverwaltung' },
  { value: 'email', label: 'E-Mail Versand' },
  { value: 'billing', label: 'Monatliche Abrechnung' },
  { value: 'commissions', label: 'Provisionsverwaltung' },
  { value: 'notifications', label: 'Benachrichtigungen' },
  { value: 'territories', label: 'Gebietsverwaltung' },
  { value: 'cleanup', label: 'Datenbank Bereinigung' },
  { value: 'sepa-mandates', label: 'SEPA-Mandate' },
  { value: 'api-settings', label: 'API-Einstellungen' },
  { value: 'email-settings', label: 'Email-Einstellungen' },
  { value: 'email-templates', label: 'Email Templates' },
  { value: 'b24-employees', label: 'Mitarbeiterverwaltung' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'server-info', label: 'Server-Übersicht' },
  { value: 'security', label: 'Sicherheit & Account' },
  { value: 'sales', label: 'Sales CRM' },
  { value: 'kvp', label: 'KVP - Verbesserungsvorschläge' },
  { value: 'files', label: 'Dateiverwaltung' },
  { value: 'co2-tracking', label: 'CO₂-Tracking' },
  { value: 'buchhaltung', label: 'Buchhaltung' },
  { value: 'influencer-management', label: 'Influencer-Verwaltung' },
  { value: 'influencer-applications', label: 'Influencer-Bewerbungen' },
  { value: 'influencer-payments', label: 'Influencer-Auszahlungen' },
  { value: 'procurement', label: 'Beschaffung & Einkauf' },
  { value: 'vehicles', label: 'Fahrzeugverwaltung' },
  { value: 'email-blacklist', label: 'Email-Blacklist' },
]

interface Permission {
  resource: string
  hasAccess: boolean
}

interface Workshop {
  id: string
  companyName: string
  city: string
}

interface ActivityLog {
  id: string
  action: string
  resource?: string
  resourceId?: string
  details?: string
  ipAddress?: string
  createdAt: string
}

interface Analytics {
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
    position?: string
    department?: string
  }
  workshops: {
    total: number
    active: number
    verified: number
    list: Workshop[]
  }
  commissions: {
    total: number
    totalAmount: number
    paidAmount: number
    pendingAmount: number
    byWorkshop: Array<{
      workshopId: string
      workshopName: string
      totalCommissions: number
      totalAmount: number
      paidAmount: number
      pendingAmount: number
    }>
    byMonth: Array<{
      month: string
      count: number
      amount: number
      paidAmount: number
    }>
  }
  recentBookings: Array<{
    id: string
    appointmentDate: string
    status: string
    workshopName: string
    createdAt: string
  }>
}

interface Employee {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  position?: string
  department?: string
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  permissions: Permission[]
  assignedWorkshops: Workshop[]
  activityLogs: ActivityLog[]
}

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    department: '',
    isActive: true,
  })

  const [permissions, setPermissions] = useState<Permission[]>(
    AVAILABLE_RESOURCES.map(resource => ({
      resource: resource.value,
      hasAccess: false
    }))
  )

  useEffect(() => {
    fetchEmployee()
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/admin/b24-employees/${employeeId}`)
      if (response.ok) {
        const data = await response.json()
        setEmployee(data)
        
        setFormData({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          position: data.position || '',
          department: data.department || '',
          isActive: data.isActive,
        })

        // Merge permissions
        const mergedPermissions = AVAILABLE_RESOURCES.map(resource => {
          const existingPerm = data.permissions.find((p: Permission) => p.resource === resource.value)
          return {
            resource: resource.value,
            hasAccess: existingPerm ? (existingPerm.canRead || existingPerm.canWrite || existingPerm.canDelete) : false
          }
        })
        setPermissions(mergedPermissions)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true)
      const response = await fetch(`/api/admin/b24-employees/${employeeId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePermissionChange = (resourceIndex: number, checked: boolean) => {
    const newPermissions = [...permissions]
    newPermissions[resourceIndex].hasAccess = checked
    setPermissions(newPermissions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const activePermissions = permissions.filter(
        perm => perm.hasAccess
      ).map(perm => ({
        resource: perm.resource,
        canRead: true,
        canWrite: true,
        canDelete: true
      }))

      const response = await fetch(`/api/admin/b24-employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: activePermissions
        })
      })

      if (response.ok) {
        alert('Mitarbeiter wurde aktualisiert.')
        router.push('/admin/b24-employees')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert('Fehler beim Aktualisieren des Mitarbeiters')
    } finally {
      setSaving(false)
    }
  }

  const handleSendSetupEmail = async () => {
    if (!confirm('Möchten Sie eine neue Setup-Email versenden?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/b24-employees/${employeeId}/send-setup-email`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Setup-Email wurde erfolgreich versendet.')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending setup email:', error)
      alert('Fehler beim Versenden der Setup-Email')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Laden...</div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Mitarbeiter nicht gefunden</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {employee.email}
                {employee.emailVerified && (
                  <Badge variant="outline" className="text-xs">Verifiziert</Badge>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/b24-employees')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details & Rechte</TabsTrigger>
              <TabsTrigger value="workshops">
                <Building2 className="mr-2 h-4 w-4" />
                Workshops ({employee.assignedWorkshops.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" onClick={() => !analytics && fetchAnalytics()}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="mr-2 h-4 w-4" />
                Aktivitäten
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Persönliche Daten</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Abteilung</Label>
                      <Input
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, isActive: checked as boolean })
                      }
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Mitarbeiter ist aktiv
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Wählen Sie aus, welche Seiten und Funktionen dieser Mitarbeiter sehen und nutzen kann.
                  </p>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Seite / Bereich</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Zugriff erlauben</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {AVAILABLE_RESOURCES.map((resource, index) => (
                          <tr key={resource.value} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{resource.label}</td>
                            <td className="px-4 py-3 text-center">
                              <Checkbox
                                checked={permissions[index].hasAccess}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(index, checked as boolean)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Password Reset */}
                {!employee.emailVerified && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      Dieser Mitarbeiter hat sein Passwort noch nicht festgelegt.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendSetupEmail}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Setup-Email erneut senden
                    </Button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Schnellzugriff</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/b24-employees/${employeeId}/documents`)}
                    >
                      📄 Dokumente verwalten
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/b24-employees')}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Wird gespeichert...' : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Speichern
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="workshops">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Zugewiesene Werkstätten</h3>
                  <Button variant="outline" size="sm">
                    Werkstatt zuweisen
                  </Button>
                </div>

                {employee.assignedWorkshops.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Keine Werkstätten zugewiesen
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {employee.assignedWorkshops.map(workshop => (
                      <Card key={workshop.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{workshop.companyName}</h4>
                              <p className="text-sm text-gray-600">{workshop.city}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              Details →
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                {loadingAnalytics ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Lade Analytics...</p>
                  </div>
                ) : analytics ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Zugewiesene Werkstätten
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{analytics.workshops.total}</p>
                          <p className="text-sm text-gray-500">
                            {analytics.workshops.active} aktiv, {analytics.workshops.verified} verifiziert
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Gesamt Provisionen
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{analytics.commissions.total}</p>
                          <p className="text-sm text-gray-500">
                            {analytics.commissions.totalAmount.toLocaleString('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Bezahlt
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.commissions.paidAmount.toLocaleString('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {((analytics.commissions.paidAmount / analytics.commissions.totalAmount) * 100).toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            Ausstehend
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-orange-600">
                            {analytics.commissions.pendingAmount.toLocaleString('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {((analytics.commissions.pendingAmount / analytics.commissions.totalAmount) * 100).toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Commissions by Workshop */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Provisionen nach Werkstatt</CardTitle>
                        <CardDescription>
                          Umsatzübersicht der zugewiesenen Werkstätten
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.commissions.byWorkshop.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">Keine Provisionen vorhanden</p>
                        ) : (
                          <div className="space-y-2">
                            {analytics.commissions.byWorkshop.map(item => (
                              <div key={item.workshopId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{item.workshopName}</h4>
                                  <Badge variant="outline">
                                    {item.totalCommissions} Provisionen
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Gesamt</p>
                                    <p className="font-semibold">
                                      {item.totalAmount.toLocaleString('de-DE', { 
                                        style: 'currency', 
                                        currency: 'EUR' 
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Bezahlt</p>
                                    <p className="font-semibold text-green-600">
                                      {item.paidAmount.toLocaleString('de-DE', { 
                                        style: 'currency', 
                                        currency: 'EUR' 
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Ausstehend</p>
                                    <p className="font-semibold text-orange-600">
                                      {item.pendingAmount.toLocaleString('de-DE', { 
                                        style: 'currency', 
                                        currency: 'EUR' 
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Monthly Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Monatliche Übersicht</CardTitle>
                        <CardDescription>
                          Provisionen nach Monat
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.commissions.byMonth.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">Keine Daten vorhanden</p>
                        ) : (
                          <div className="space-y-2">
                            {analytics.commissions.byMonth.map(item => (
                              <div key={item.month} className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <p className="font-medium">
                                    {new Date(item.month + '-01').toLocaleDateString('de-DE', { 
                                      year: 'numeric', 
                                      month: 'long' 
                                    })}
                                  </p>
                                  <p className="text-sm text-gray-600">{item.count} Provisionen</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {item.amount.toLocaleString('de-DE', { 
                                      style: 'currency', 
                                      currency: 'EUR' 
                                    })}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    {item.paidAmount.toLocaleString('de-DE', { 
                                      style: 'currency', 
                                      currency: 'EUR' 
                                    })} bezahlt
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Bookings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Letzte Buchungen</CardTitle>
                        <CardDescription>
                          Aktuelle Buchungen von zugewiesenen Werkstätten
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analytics.recentBookings.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">Keine Buchungen vorhanden</p>
                        ) : (
                          <div className="space-y-2">
                            {analytics.recentBookings.map(booking => (
                              <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <p className="font-medium">{booking.workshopName}</p>
                                  <p className="text-sm text-gray-600">
                                    Termin: {new Date(booking.appointmentDate).toLocaleString('de-DE')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={
                                    booking.status === 'CONFIRMED' ? 'default' :
                                    booking.status === 'COMPLETED' ? 'default' :
                                    booking.status === 'CANCELLED' ? 'secondary' :
                                    'outline'
                                  }>
                                    {booking.status}
                                  </Badge>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(booking.createdAt).toLocaleDateString('de-DE')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Klicke auf den Analytics Tab um Daten zu laden</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Letzte Aktivitäten</h3>

                {employee.activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Keine Aktivitäten vorhanden
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employee.activityLogs.map(log => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            {log.resource && (
                              <p className="text-sm text-gray-600">
                                {log.resource} {log.resourceId && `(${log.resourceId})`}
                              </p>
                            )}
                            {log.details && (
                              <p className="text-sm text-gray-500 mt-1">{log.details}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString('de-DE')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
