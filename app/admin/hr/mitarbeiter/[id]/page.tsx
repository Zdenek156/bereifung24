'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Save, AlertCircle } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
  department?: string
  position?: string
  hierarchyLevel?: number
}

interface EmployeeData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  department?: string
  managerId?: string
  hierarchyLevel: number
  employmentType?: string
  workTimeModel?: string
  weeklyHours?: number
  monthlyHours?: number
  dailyHours?: number
  workDaysPerWeek?: number
  workStartTime?: string
  workEndTime?: string
  contractStart?: string
  contractEnd?: string
  probationEndDate?: string
  noticePeriod?: string
  salaryType?: string
  monthlySalary?: number
  annualSalary?: number
  hourlyRate?: number
  isMinijob: boolean
  miniJobExempt: boolean
  taxId?: string
  taxClass?: string
  childAllowance?: number
  religion: string
  socialSecurityNumber?: string
  healthInsurance?: string
  healthInsuranceRate?: number
  isChildless: boolean
  bankName?: string
  iban?: string
  bic?: string
}

export default function EditEmployeePage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.id as string
  
  const [formData, setFormData] = useState<EmployeeData | null>(null)
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmployee()
    fetchManagers()
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/admin/hr/employees/${employeeId}`)
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          department: data.department || '',
          managerId: data.managerId || '',
          hierarchyLevel: data.hierarchyLevel || 0,
          employmentType: data.employmentType || '',
          workTimeModel: data.workTimeModel || '',
          weeklyHours: data.weeklyHours || 40,
          monthlyHours: data.monthlyHours || null,
          dailyHours: data.dailyHours || 8,
          workDaysPerWeek: data.workDaysPerWeek || 5,
          workStartTime: data.workStartTime || '',
          workEndTime: data.workEndTime || '',
          contractStart: data.contractStart ? new Date(data.contractStart).toISOString().split('T')[0] : '',
          contractEnd: data.contractEnd ? new Date(data.contractEnd).toISOString().split('T')[0] : '',
          probationEndDate: data.probationEndDate ? new Date(data.probationEndDate).toISOString().split('T')[0] : '',
          noticePeriod: data.noticePeriod || '',
          salaryType: data.salaryType || '',
          monthlySalary: data.monthlySalary || null,
          annualSalary: data.annualSalary || null,
          hourlyRate: data.hourlyRate || null,
          isMinijob: data.isMinijob || false,
          miniJobExempt: data.miniJobExempt || false,
          taxId: data.taxId || '',
          taxClass: data.taxClass || '',
          childAllowance: data.childAllowance || 0,
          religion: data.religion || 'NONE',
          socialSecurityNumber: data.socialSecurityNumber || '',
          healthInsurance: data.healthInsurance || '',
          healthInsuranceRate: data.healthInsuranceRate || null,
          isChildless: data.isChildless || false,
          bankName: data.bankName || '',
          iban: data.iban || '',
          bic: data.bic || ''
        })
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('Fehler beim Laden der Mitarbeiterdaten')
    } finally {
      setLoading(false)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/hr/employees')
      if (response.ok) {
        const result = await response.json()
        const data = Array.isArray(result) ? result : (result.data || [])
        setManagers(data)
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData) return

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Bitte füllen Sie mindestens Vorname, Nachname und E-Mail aus.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/hr/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/hr/mitarbeiter')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Aktualisieren des Mitarbeiters')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      setError('Netzwerkfehler beim Aktualisieren des Mitarbeiters')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof EmployeeData, value: any) => {
    if (!formData) return
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (loading || !formData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lädt...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Mitarbeiter bearbeiten</h1>
            <p className="text-gray-600">{formData.firstName} {formData.lastName}</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Speichert...' : 'Speichern'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grunddaten */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👤 Grunddaten <span className="text-red-500 text-sm">*Pflichtfelder</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Vorname *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="lastName">Nachname *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="position">Position / Stelle</Label>
              <Input
                id="position"
                placeholder="z.B. Entwickler, Monteur, Manager"
                value={formData.position || ''}
                onChange={(e) => updateField('position', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="department">Abteilung</Label>
              <Input
                id="department"
                placeholder="z.B. IT, Werkstatt, Verwaltung"
                value={formData.department || ''}
                onChange={(e) => updateField('department', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Hierarchie */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🏢 Hierarchie & Zuordnung</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="managerId">Vorgesetzter</Label>
              <select
                id="managerId"
                value={formData.managerId || ''}
                onChange={(e) => updateField('managerId', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kein Vorgesetzter</option>
                {managers.filter(m => m.id !== employeeId).map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} ({manager.position || 'Keine Position'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="hierarchyLevel">Hierarchie-Ebene</Label>
              <Input
                id="hierarchyLevel"
                type="number"
                min="0"
                value={formData.hierarchyLevel}
                onChange={(e) => updateField('hierarchyLevel', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">0 = Mitarbeiter, 1 = Teamleiter, 2 = Abteilungsleiter, etc.</p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => router.push(`/admin/hr/mitarbeiter/${employeeId}/hr-daten`)}
            variant="outline"
          >
            Zu HR-Daten (Vertrag, Gehalt, etc.)
          </Button>
        </div>
      </form>
    </div>
  )
}
