'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Save, UserPlus, AlertCircle } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useSession } from 'next-auth/react'
import { getEmployeeUrl } from '@/lib/utils/employeeRoutes'

interface Manager {
  id: string
  firstName: string
  lastName: string
  email: string
  department?: string
  position?: string
  hierarchyLevel?: number
}

interface NewEmployeeData {
  // Basic Info
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  department?: string
  
  // Hierarchy
  managerId?: string
  hierarchyLevel: number
  
  // Contract
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
  
  // Salary
  salaryType?: string
  monthlySalary?: number
  annualSalary?: number
  hourlyRate?: number
  isMinijob: boolean
  miniJobExempt: boolean
  
  // Tax & SV
  taxId?: string
  taxClass?: string
  childAllowance?: number
  religion: string
  socialSecurityNumber?: string
  healthInsurance?: string
  healthInsuranceRate?: number
  isChildless: boolean
  
  // Bank
  bankName?: string
  iban?: string
  bic?: string
}

export default function NewEmployeePage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [formData, setFormData] = useState<NewEmployeeData>({
    firstName: '',
    lastName: '',
    email: '',
    hierarchyLevel: 3,
    isMinijob: false,
    miniJobExempt: false,
    religion: 'NONE',
    isChildless: false,
    workDaysPerWeek: 5,
    dailyHours: 8,
    weeklyHours: 40
  })
  
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/hr/employees')
      if (response.ok) {
        const result = await response.json()
        // Handle both response formats: direct array or { success, data } wrapper
        const data = Array.isArray(result) ? result : (result.data || [])
        setManagers(data)
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Bitte füllen Sie mindestens Vorname, Nachname und E-Mail aus.')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      return
    }

    setSaving(true)

    try {
      // Check if email already exists
      const checkResponse = await fetch(`/api/admin/hr/employees`)
      if (checkResponse.ok) {
        const employees = await checkResponse.json()
        const emailExists = employees.some((emp: Manager) => 
          emp.email.toLowerCase() === formData.email.toLowerCase()
        )
        
        if (emailExists) {
          setError('Diese E-Mail-Adresse wird bereits von einem anderen Mitarbeiter verwendet.')
          setSaving(false)
          return
        }
      }

      // Create employee
      const response = await fetch('/api/admin/b24-employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newEmployee = await response.json()
        router.push(getEmployeeUrl('/admin/hr/mitarbeiter', session?.user?.role))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fehler beim Erstellen des Mitarbeiters')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      setError('Netzwerkfehler beim Erstellen des Mitarbeiters')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof NewEmployeeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
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
            <h1 className="text-3xl font-bold">Neuer Mitarbeiter</h1>
            <p className="text-gray-600">Legen Sie einen neuen Mitarbeiter an</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Speichert...' : 'Mitarbeiter anlegen'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grunddaten */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">Grunddaten</h2>
            <span className="text-sm text-red-600">*Pflichtfelder</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Vorname *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nachname *</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Position / Stelle</Label>
              <Input
                value={formData.position || ''}
                onChange={(e) => updateField('position', e.target.value)}
                placeholder="z.B. Entwickler, Monteur, Manager"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Abteilung</Label>
              <Input
                value={formData.department || ''}
                onChange={(e) => updateField('department', e.target.value)}
                placeholder="z.B. IT, Werkstatt, Verwaltung"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Hierarchie */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Hierarchie & Zuordnung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Vorgesetzter</Label>
              <select
                value={formData.managerId || ''}
                onChange={(e) => updateField('managerId', e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="">Kein Vorgesetzter</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} - {manager.position || 'Keine Position'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Hierarchie-Ebene</Label>
              <select
                value={formData.hierarchyLevel}
                onChange={(e) => updateField('hierarchyLevel', parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value={0}>Geschäftsführung</option>
                <option value={1}>Manager</option>
                <option value={2}>Teamleiter</option>
                <option value={3}>Mitarbeiter</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                0 = Geschäftsführung (höchste), 3 = Mitarbeiter
              </p>
            </div>
          </div>
        </Card>

        {/* Vertragsdaten */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Vertragsdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Beschäftigungsart</Label>
              <select
                value={formData.employmentType || ''}
                onChange={(e) => updateField('employmentType', e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="">Bitte wählen</option>
                <option value="PERMANENT">Unbefristet</option>
                <option value="TEMPORARY">Befristet</option>
                <option value="MINIJOB">Minijob</option>
                <option value="APPRENTICE">Ausbildung</option>
                <option value="INTERN">Praktikum</option>
                <option value="FREELANCE">Freiberufler</option>
                <option value="SHORTTERM">Kurzfristig beschäftigt</option>
              </select>
            </div>
            <div>
              <Label>Arbeitszeitmodell</Label>
              <select
                value={formData.workTimeModel || ''}
                onChange={(e) => updateField('workTimeModel', e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="">Bitte wählen</option>
                <option value="FULLTIME_40H">Vollzeit 40h</option>
                <option value="FULLTIME_37_5H">Vollzeit 37,5h</option>
                <option value="FULLTIME_35H">Vollzeit 35h</option>
                <option value="PARTTIME_30H">Teilzeit 30h (75%)</option>
                <option value="PARTTIME_25H">Teilzeit 25h (62,5%)</option>
                <option value="PARTTIME_20H">Teilzeit 20h (50%)</option>
                <option value="PARTTIME_15H">Teilzeit 15h (37,5%)</option>
                <option value="MINIJOB_603">Minijob 603€</option>
                <option value="SHORTTERM_EMPLOYMENT">Kurzfristige Beschäftigung</option>
                <option value="FLEXTIME">Gleitzeit</option>
                <option value="TRUST_BASED">Vertrauensarbeitszeit</option>
                <option value="SHIFT_WORK">Schichtarbeit</option>
                <option value="CUSTOM">Benutzerdefiniert</option>
              </select>
            </div>
            <div>
              <Label>Wochenstunden</Label>
              <Input
                type="number"
                value={formData.weeklyHours || ''}
                onChange={(e) => updateField('weeklyHours', parseFloat(e.target.value) || undefined)}
                step="0.5"
                min="0"
                max="60"
                placeholder="z.B. 40"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Arbeitstage pro Woche</Label>
              <Input
                type="number"
                value={formData.workDaysPerWeek || ''}
                onChange={(e) => updateField('workDaysPerWeek', parseInt(e.target.value) || undefined)}
                min="1"
                max="7"
                placeholder="z.B. 5"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Vertragsbeginn</Label>
              <Input
                type="date"
                value={formData.contractStart || ''}
                onChange={(e) => updateField('contractStart', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Vertragsende (befristet)</Label>
              <Input
                type="date"
                value={formData.contractEnd || ''}
                onChange={(e) => updateField('contractEnd', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ende Probezeit</Label>
              <Input
                type="date"
                value={formData.probationEndDate || ''}
                onChange={(e) => updateField('probationEndDate', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kündigungsfrist</Label>
              <Input
                value={formData.noticePeriod || ''}
                onChange={(e) => updateField('noticePeriod', e.target.value)}
                placeholder="z.B. 4 Wochen zum Monatsende"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Vergütung */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Vergütung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Gehaltsart</Label>
              <select
                value={formData.salaryType || ''}
                onChange={(e) => updateField('salaryType', e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="">Bitte wählen</option>
                <option value="MONTHLY">Monatsgehalt</option>
                <option value="ANNUAL">Jahresgehalt</option>
                <option value="HOURLY">Stundenlohn</option>
              </select>
            </div>
            <div>
              <Label>Monatsgehalt (brutto)</Label>
              <Input
                type="number"
                value={formData.monthlySalary || ''}
                onChange={(e) => updateField('monthlySalary', parseFloat(e.target.value) || undefined)}
                step="0.01"
                min="0"
                placeholder="z.B. 3500.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Jahresgehalt (brutto)</Label>
              <Input
                type="number"
                value={formData.annualSalary || ''}
                onChange={(e) => updateField('annualSalary', parseFloat(e.target.value) || undefined)}
                step="0.01"
                min="0"
                placeholder="z.B. 42000.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Stundenlohn (brutto)</Label>
              <Input
                type="number"
                value={formData.hourlyRate || ''}
                onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value) || undefined)}
                step="0.01"
                min="0"
                placeholder="z.B. 15.50"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isMinijob}
                onChange={(e) => updateField('isMinijob', e.target.checked)}
                id="isMinijob"
              />
              <Label htmlFor="isMinijob" className="cursor-pointer">
                Minijob (450€-Basis)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.miniJobExempt}
                onChange={(e) => updateField('miniJobExempt', e.target.checked)}
                id="miniJobExempt"
              />
              <Label htmlFor="miniJobExempt" className="cursor-pointer">
                Von RV-Pflicht befreit
              </Label>
            </div>
          </div>
        </Card>

        {/* Steuer & Sozialversicherung */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Steuer & Sozialversicherung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Steuer-ID</Label>
              <Input
                value={formData.taxId || ''}
                onChange={(e) => updateField('taxId', e.target.value)}
                placeholder="z.B. 12345678901"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Lohnsteuerklasse</Label>
              <select
                value={formData.taxClass || ''}
                onChange={(e) => updateField('taxClass', e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="">Bitte wählen</option>
                <option value="1">Klasse 1</option>
                <option value="2">Klasse 2</option>
                <option value="3">Klasse 3</option>
                <option value="4">Klasse 4</option>
                <option value="5">Klasse 5</option>
                <option value="6">Klasse 6</option>
              </select>
            </div>
            <div>
              <Label>Kinderfreibetrag</Label>
              <Input
                type="number"
                value={formData.childAllowance || ''}
                onChange={(e) => updateField('childAllowance', parseFloat(e.target.value) || undefined)}
                step="0.5"
                min="0"
                placeholder="z.B. 1.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Konfession</Label>
              <select
                value={formData.religion}
                onChange={(e) => updateField('religion', e.target.value)}
                className="w-full mt-1 border rounded px-3 py-2"
              >
                <option value="NONE">Keine</option>
                <option value="RK">Römisch-Katholisch (rk)</option>
                <option value="EV">Evangelisch (ev)</option>
                <option value="OTHER">Andere</option>
              </select>
            </div>
            <div>
              <Label>Sozialversicherungsnummer</Label>
              <Input
                value={formData.socialSecurityNumber || ''}
                onChange={(e) => updateField('socialSecurityNumber', e.target.value)}
                placeholder="z.B. 12 123456 A 123"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Krankenkasse</Label>
              <Input
                value={formData.healthInsurance || ''}
                onChange={(e) => updateField('healthInsurance', e.target.value)}
                placeholder="z.B. AOK, TK, Barmer"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Zusatzbeitrag KV (%)</Label>
              <Input
                type="number"
                value={formData.healthInsuranceRate || ''}
                onChange={(e) => updateField('healthInsuranceRate', parseFloat(e.target.value) || undefined)}
                step="0.01"
                min="0"
                max="5"
                placeholder="z.B. 1.3"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isChildless}
                onChange={(e) => updateField('isChildless', e.target.checked)}
                id="isChildless"
              />
              <Label htmlFor="isChildless" className="cursor-pointer">
                Kinderlos (Zuschlag PV)
              </Label>
            </div>
          </div>
        </Card>

        {/* Bankverbindung */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Bankverbindung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bank / Kreditinstitut</Label>
              <Input
                value={formData.bankName || ''}
                onChange={(e) => updateField('bankName', e.target.value)}
                placeholder="z.B. Sparkasse München"
                className="mt-1"
              />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input
                value={formData.iban || ''}
                onChange={(e) => updateField('iban', e.target.value)}
                placeholder="DE89 3704 0044 0532 0130 00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>BIC / SWIFT</Label>
              <Input
                value={formData.bic || ''}
                onChange={(e) => updateField('bic', e.target.value)}
                placeholder="COBADEFFXXX"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Submit Button Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(getEmployeeUrl('/admin/hr/mitarbeiter', session?.user?.role))}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichert...' : 'Mitarbeiter anlegen'}
          </Button>
        </div>
      </form>
    </div>
  )
}
