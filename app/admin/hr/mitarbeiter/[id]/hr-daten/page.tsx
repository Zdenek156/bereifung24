'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, User, Briefcase, DollarSign, FileText, Building2, Calendar, UserX } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useSession } from 'next-auth/react'
import { getEmployeeUrl } from '@/lib/utils/employeeRoutes'

interface HRData {
  // Hierarchy
  managerId?: string
  hierarchyLevel: number
  
  // Personal Data (from EmployeeProfile)
  birthDate?: string
  birthPlace?: string
  nationality?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  
  // Emergency Contact (from EmployeeProfile)
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  
  // Contract
  employmentType?: string
  workTimeModel?: string
  weeklyHours?: number
  monthlyHours?: number
  dailyHours?: number
  workDaysPerWeek?: number
  workStartTime?: string
  workEndTime?: string
  coreTimeStart?: string
  coreTimeEnd?: string
  flexTimeStart?: string
  flexTimeEnd?: string
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

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department?: string
  position?: string
}

export default function HRDataEditPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [hrData, setHRData] = useState<HRData>({
    hierarchyLevel: 0,
    isMinijob: false,
    miniJobExempt: false,
    religion: 'NONE',
    isChildless: false
  })
  const [managers, setManagers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmployee()
    fetchManagers()
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/admin/hr/employees/${employeeId}`)
      if (response.ok) {
        const result = await response.json()
        const data = result.success ? result.data : result
        if (data) {
          setEmployee(data)
        
          // Set HR data from employee
          setHRData({
            managerId: data.managerId,
            hierarchyLevel: data.hierarchyLevel || 0,
            // Personal data from profile
            birthDate: data.profile?.birthDate,
            birthPlace: data.profile?.birthPlace,
            nationality: data.profile?.nationality,
            address: data.profile?.address,
            city: data.profile?.city,
            postalCode: data.profile?.postalCode,
            country: data.profile?.country || 'Deutschland',
            emergencyContactName: data.profile?.emergencyContactName,
            emergencyContactPhone: data.profile?.emergencyContactPhone,
            emergencyContactRelation: data.profile?.emergencyContactRelation,
            // Contract data
            employmentType: data.employmentType,
            workTimeModel: data.workTimeModel,
            weeklyHours: data.weeklyHours,
            monthlyHours: data.monthlyHours,
            dailyHours: data.dailyHours,
            workDaysPerWeek: data.workDaysPerWeek,
            workStartTime: data.workStartTime,
            workEndTime: data.workEndTime,
            coreTimeStart: data.coreTimeStart,
            coreTimeEnd: data.coreTimeEnd,
            flexTimeStart: data.flexTimeStart,
            flexTimeEnd: data.flexTimeEnd,
            contractStart: data.contractStart,
            contractEnd: data.contractEnd,
            probationEndDate: data.probationEndDate,
            noticePeriod: data.noticePeriod,
            // Salary
            salaryType: data.salaryType,
            monthlySalary: data.monthlySalary,
            annualSalary: data.annualSalary,
            hourlyRate: data.hourlyRate,
            isMinijob: data.isMinijob || false,
            miniJobExempt: data.miniJobExempt || false,
            // Tax & SV
            taxId: data.taxId,
            taxClass: data.taxClass,
            childAllowance: data.childAllowance,
            religion: data.religion || 'NONE',
            socialSecurityNumber: data.socialSecurityNumber,
            healthInsurance: data.healthInsurance,
            healthInsuranceRate: data.healthInsuranceRate,
            isChildless: data.isChildless || false,
            // Bank
            bankName: data.bankName,
            iban: data.iban,
            bic: data.bic
          })
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/hr/employees')
      if (response.ok) {
        const result = await response.json()
        const data = result.success ? result.data : []
        // Filter out current employee and show only potential managers (hierarchyLevel >= 1)
        setManagers(data.filter((e: Employee) => e.id !== employeeId))
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/hr/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hrData)
      })

      if (response.ok) {
        alert('HR-Daten erfolgreich gespeichert!')
        router.push(getEmployeeUrl('/admin/hr/mitarbeiter', session?.user?.role))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Error saving HR data:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm(`Möchten Sie ${employee?.firstName} ${employee?.lastName} wirklich deaktivieren?\n\nDer Mitarbeiter wird aus der aktiven Mitarbeiterliste entfernt, aber alle Daten bleiben erhalten und können in "Ehemalige Mitarbeiter" eingesehen werden.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/hr/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'TERMINATED' })
      })

      if (response.ok) {
        alert('Mitarbeiter wurde deaktiviert und in die ehemaligen Mitarbeiter verschoben.')
        router.push(getEmployeeUrl('/admin/hr/mitarbeiter', session?.user?.role))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Fehler beim Deaktivieren'}`)
      }
    } catch (error) {
      console.error('Error deactivating employee:', error)
      alert('Fehler beim Deaktivieren')
    }
  }

  if (loading || !employee) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Mitarbeiter...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton href={getEmployeeUrl(`/admin/hr/mitarbeiter/${employeeId}`, session?.user?.role)} />
          <div>
            <h1 className="text-3xl font-bold">HR-Daten bearbeiten</h1>
            <p className="text-gray-600 mt-1">{employee.firstName} {employee.lastName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDeactivate}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <UserX className="h-4 w-4 mr-2" />
            Mitarbeiter deaktivieren
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Beschäftigungsverhältnis */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-bold">Beschäftigungsverhältnis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="employmentType">Beschäftigungsart *</Label>
              <select
                id="employmentType"
                value={hrData.employmentType || ''}
                onChange={(e) => setHRData({ ...hrData, employmentType: e.target.value })}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="">Bitte wählen</option>
                <option value="PERMANENT">Unbefristet</option>
                <option value="TEMPORARY">Befristet</option>
                <option value="INTERN">Praktikant</option>
                <option value="APPRENTICE">Azubi</option>
                <option value="FREELANCE">Freelancer</option>
                <option value="MINIJOB">Minijob</option>
                <option value="SHORTTERM">Kurzfristige Beschäftigung</option>
              </select>
            </div>
            <div>
              <Label htmlFor="contractStart">Vertragsbeginn</Label>
              <Input
                id="contractStart"
                type="date"
                value={hrData.contractStart ? new Date(hrData.contractStart).toISOString().split('T')[0] : ''}
                onChange={(e) => setHRData({ ...hrData, contractStart: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contractEnd">Vertragsende (bei Befristung)</Label>
              <Input
                id="contractEnd"
                type="date"
                value={hrData.contractEnd ? new Date(hrData.contractEnd).toISOString().split('T')[0] : ''}
                onChange={(e) => setHRData({ ...hrData, contractEnd: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="probationEndDate">Probezeit endet am</Label>
              <Input
                id="probationEndDate"
                type="date"
                value={hrData.probationEndDate ? new Date(hrData.probationEndDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setHRData({ ...hrData, probationEndDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="noticePeriod">Kündigungsfrist</Label>
              <Input
                id="noticePeriod"
                type="text"
                placeholder="z.B. 4 Wochen zum Monatsende"
                value={hrData.noticePeriod || ''}
                onChange={(e) => setHRData({ ...hrData, noticePeriod: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Persönliche Stammdaten */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">Persönliche Stammdaten</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="birthDate">Geburtsdatum</Label>
              <Input
                id="birthDate"
                type="date"
                value={hrData.birthDate ? new Date(hrData.birthDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setHRData({ ...hrData, birthDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="birthPlace">Geburtsort</Label>
              <Input
                id="birthPlace"
                type="text"
                placeholder="z.B. München"
                value={hrData.birthPlace || ''}
                onChange={(e) => setHRData({ ...hrData, birthPlace: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nationality">Nationalität</Label>
              <Input
                id="nationality"
                type="text"
                placeholder="z.B. Deutsch"
                value={hrData.nationality || ''}
                onChange={(e) => setHRData({ ...hrData, nationality: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Straße und Hausnummer</Label>
              <Input
                id="address"
                type="text"
                placeholder="z.B. Musterstraße 123"
                value={hrData.address || ''}
                onChange={(e) => setHRData({ ...hrData, address: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">PLZ</Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="12345"
                value={hrData.postalCode || ''}
                onChange={(e) => setHRData({ ...hrData, postalCode: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">Ort</Label>
              <Input
                id="city"
                type="text"
                placeholder="z.B. Berlin"
                value={hrData.city || ''}
                onChange={(e) => setHRData({ ...hrData, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                type="text"
                placeholder="Deutschland"
                value={hrData.country || 'Deutschland'}
                onChange={(e) => setHRData({ ...hrData, country: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Notfallkontakt */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-bold">Notfallkontakt</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Name</Label>
              <Input
                id="emergencyContactName"
                type="text"
                placeholder="z.B. Maria Mustermann"
                value={hrData.emergencyContactName || ''}
                onChange={(e) => setHRData({ ...hrData, emergencyContactName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactPhone">Telefon</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                placeholder="+49 123 456789"
                value={hrData.emergencyContactPhone || ''}
                onChange={(e) => setHRData({ ...hrData, emergencyContactPhone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactRelation">Beziehung</Label>
              <select
                id="emergencyContactRelation"
                value={hrData.emergencyContactRelation || ''}
                onChange={(e) => setHRData({ ...hrData, emergencyContactRelation: e.target.value })}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="">Bitte wählen</option>
                <option value="Ehepartner">Ehepartner/in</option>
                <option value="Partner">Partner/in</option>
                <option value="Vater">Vater</option>
                <option value="Mutter">Mutter</option>
                <option value="Geschwister">Geschwister</option>
                <option value="Kind">Kind</option>
                <option value="Freund">Freund/in</option>
                <option value="Sonstige">Sonstige</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Arbeitszeit */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold">Arbeitszeit</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="workTimeModel">Arbeitszeitmodell *</Label>
              <select
                id="workTimeModel"
                value={hrData.workTimeModel || ''}
                onChange={(e) => setHRData({ ...hrData, workTimeModel: e.target.value })}
                className="w-full border rounded px-3 py-2 mt-1"
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
                <option value="CUSTOM">Individuell</option>
              </select>
            </div>
            <div>
              <Label htmlFor="weeklyHours">Wochenstunden</Label>
              <Input
                id="weeklyHours"
                type="number"
                step="0.5"
                placeholder="40"
                value={hrData.weeklyHours || ''}
                onChange={(e) => setHRData({ ...hrData, weeklyHours: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workDaysPerWeek">Arbeitstage/Woche</Label>
              <Input
                id="workDaysPerWeek"
                type="number"
                placeholder="5"
                value={hrData.workDaysPerWeek || ''}
                onChange={(e) => setHRData({ ...hrData, workDaysPerWeek: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workStartTime">Arbeitsbeginn</Label>
              <Input
                id="workStartTime"
                type="time"
                value={hrData.workStartTime || ''}
                onChange={(e) => setHRData({ ...hrData, workStartTime: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workEndTime">Arbeitsende</Label>
              <Input
                id="workEndTime"
                type="time"
                value={hrData.workEndTime || ''}
                onChange={(e) => setHRData({ ...hrData, workEndTime: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold mb-3">Gleitzeit (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coreTimeStart">Kernzeit von</Label>
                <Input
                  id="coreTimeStart"
                  type="time"
                  value={hrData.coreTimeStart || ''}
                  onChange={(e) => setHRData({ ...hrData, coreTimeStart: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coreTimeEnd">Kernzeit bis</Label>
                <Input
                  id="coreTimeEnd"
                  type="time"
                  value={hrData.coreTimeEnd || ''}
                  onChange={(e) => setHRData({ ...hrData, coreTimeEnd: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="flexTimeStart">Gleitzeit von</Label>
                <Input
                  id="flexTimeStart"
                  type="time"
                  value={hrData.flexTimeStart || ''}
                  onChange={(e) => setHRData({ ...hrData, flexTimeStart: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="flexTimeEnd">Gleitzeit bis</Label>
                <Input
                  id="flexTimeEnd"
                  type="time"
                  value={hrData.flexTimeEnd || ''}
                  onChange={(e) => setHRData({ ...hrData, flexTimeEnd: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Gehalt */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold">Gehalt & Vergütung</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="salaryType">Gehaltsart *</Label>
              <select
                id="salaryType"
                value={hrData.salaryType || ''}
                onChange={(e) => setHRData({ ...hrData, salaryType: e.target.value })}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="">Bitte wählen</option>
                <option value="MONTHLY">Monatlich (Festgehalt)</option>
                <option value="HOURLY">Stundenlohn</option>
                <option value="ANNUAL">Jahresgehalt</option>
              </select>
            </div>
            <div>
              <Label htmlFor="monthlySalary">Monatsgehalt (brutto)</Label>
              <Input
                id="monthlySalary"
                type="number"
                step="0.01"
                placeholder="4500.00"
                value={hrData.monthlySalary || ''}
                onChange={(e) => setHRData({ ...hrData, monthlySalary: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Stundenlohn (für Stundenlohn-Modelle)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                placeholder="25.00"
                value={hrData.hourlyRate || ''}
                onChange={(e) => setHRData({ ...hrData, hourlyRate: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hrData.isMinijob}
                onChange={(e) => setHRData({ ...hrData, isMinijob: e.target.checked })}
                className="rounded"
              />
              <span>Minijob (603€/Monat)</span>
            </label>
            {hrData.isMinijob && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hrData.miniJobExempt}
                  onChange={(e) => setHRData({ ...hrData, miniJobExempt: e.target.checked })}
                  className="rounded"
                />
                <span>RV-befreit</span>
              </label>
            )}
          </div>
        </Card>

        {/* Steuern & Sozialversicherung */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-bold">Steuern & Sozialversicherung</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="taxId">Steuer-ID (11-stellig)</Label>
              <Input
                id="taxId"
                type="text"
                maxLength={11}
                placeholder="12345678901"
                value={hrData.taxId || ''}
                onChange={(e) => setHRData({ ...hrData, taxId: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="taxClass">Steuerklasse</Label>
              <select
                id="taxClass"
                value={hrData.taxClass || ''}
                onChange={(e) => setHRData({ ...hrData, taxClass: e.target.value })}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="">Bitte wählen</option>
                <option value="CLASS_I">Klasse I (ledig)</option>
                <option value="CLASS_II">Klasse II (alleinerziehend)</option>
                <option value="CLASS_III">Klasse III (verheiratet, höheres Einkommen)</option>
                <option value="CLASS_IV">Klasse IV (verheiratet, beide berufstätig)</option>
                <option value="CLASS_V">Klasse V (verheiratet, geringeres Einkommen)</option>
                <option value="CLASS_VI">Klasse VI (Nebenjob)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="childAllowance">Kinderfreibeträge</Label>
              <Input
                id="childAllowance"
                type="number"
                step="0.5"
                placeholder="0.5, 1.0, 1.5..."
                value={hrData.childAllowance || ''}
                onChange={(e) => setHRData({ ...hrData, childAllowance: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="religion">Konfession (für Kirchensteuer)</Label>
              <select
                id="religion"
                value={hrData.religion}
                onChange={(e) => setHRData({ ...hrData, religion: e.target.value })}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="NONE">Keine (keine Kirchensteuer)</option>
                <option value="CATHOLIC">Römisch-Katholisch (8-9%)</option>
                <option value="PROTESTANT">Evangelisch (8-9%)</option>
                <option value="OTHER">Andere</option>
              </select>
            </div>
            <div>
              <Label htmlFor="socialSecurityNumber">Sozialversicherungsnummer</Label>
              <Input
                id="socialSecurityNumber"
                type="text"
                placeholder="12 345678 M 123"
                value={hrData.socialSecurityNumber || ''}
                onChange={(e) => setHRData({ ...hrData, socialSecurityNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="healthInsurance">Krankenkasse</Label>
              <Input
                id="healthInsurance"
                type="text"
                placeholder="TK Techniker Krankenkasse"
                value={hrData.healthInsurance || ''}
                onChange={(e) => setHRData({ ...hrData, healthInsurance: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="healthInsuranceRate">KV-Zusatzbeitrag (%)</Label>
              <Input
                id="healthInsuranceRate"
                type="number"
                step="0.1"
                placeholder="1.7"
                value={hrData.healthInsuranceRate || ''}
                onChange={(e) => setHRData({ ...hrData, healthInsuranceRate: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hrData.isChildless}
                  onChange={(e) => setHRData({ ...hrData, isChildless: e.target.checked })}
                  className="rounded"
                />
                <span>Kinderlos (PV-Zuschlag +0,6%)</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Bankverbindung */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold">Bankverbindung</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bankName">Bank</Label>
              <Input
                id="bankName"
                type="text"
                placeholder="Deutsche Bank AG"
                value={hrData.bankName || ''}
                onChange={(e) => setHRData({ ...hrData, bankName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                type="text"
                placeholder="DE89 1234 5678 9012 3456 78"
                value={hrData.iban || ''}
                onChange={(e) => setHRData({ ...hrData, iban: e.target.value.replace(/\s/g, '').toUpperCase() })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bic">BIC</Label>
              <Input
                id="bic"
                type="text"
                placeholder="DEUTDEDBXXX"
                value={hrData.bic || ''}
                onChange={(e) => setHRData({ ...hrData, bic: e.target.value.toUpperCase() })}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(getEmployeeUrl(`/admin/hr/mitarbeiter/${employeeId}`, session?.user?.role))}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  )
}
