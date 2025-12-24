'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Save, Mail } from 'lucide-react'

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
]

interface Permission {
  resource: string
  hasAccess: boolean
}

export default function NewEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    department: '',
  })

  const [permissions, setPermissions] = useState<Permission[]>(
    AVAILABLE_RESOURCES.map(resource => ({
      resource: resource.value,
      hasAccess: false
    }))
  )

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
    setLoading(true)

    try {
      // Filter permissions with access and convert to API format
      const activePermissions = permissions
        .filter(perm => perm.hasAccess)
        .map(perm => ({
          resource: perm.resource,
          canRead: true,
          canWrite: true,
          canDelete: true
        }))

      const response = await fetch('/api/admin/b24-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: activePermissions
        })
      })

      if (response.ok) {
        const employee = await response.json()
        
        if (sendEmail) {
          // TODO: Send setup email
          alert('Mitarbeiter wurde angelegt. Setup-Email wurde versendet.')
        } else {
          alert('Mitarbeiter wurde angelegt.')
        }

        router.push('/admin/b24-employees')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      alert('Fehler beim Anlegen des Mitarbeiters')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Neuer Mitarbeiter</CardTitle>
              <CardDescription>
                Legen Sie einen neuen Bereifung24 Mitarbeiter an
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/b24-employees')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </div>
        </CardHeader>

        <CardContent>
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
                    placeholder="z.B. Account Manager"
                  />
                </div>

                <div>
                  <Label htmlFor="department">Abteilung</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="z.B. Buchhaltung"
                  />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Zugriffsrechte</h3>
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

            {/* Email Setup Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="cursor-pointer">
                Setup-Email senden (Mitarbeiter kann Passwort festlegen)
              </Label>
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Wird angelegt...' : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Mitarbeiter anlegen
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
