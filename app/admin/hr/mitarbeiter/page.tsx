'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, Building2, Clock, Euro, FileText } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getEmployeeUrl } from '@/lib/utils/employeeRoutes'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department?: string
  position?: string
  employmentType?: string
  workTimeModel?: string
  monthlySalary?: number
  contractStart?: string
  contractEnd?: string
  hierarchyLevel: number
  manager?: {
    firstName: string
    lastName: string
  }
}

export default function HRMitarbeiterPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/hr/employees')
      if (response.ok) {
        const result = await response.json()
        // Handle both response formats: direct array or { success, data } wrapper
        const data = Array.isArray(result) ? result : (result.data || [])
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEUR = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getEmploymentTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      PERMANENT: 'Unbefristet',
      TEMPORARY: 'Befristet',
      INTERN: 'Praktikant',
      APPRENTICE: 'Azubi',
      FREELANCE: 'Freelancer',
      MINIJOB: 'Minijob',
      SHORTTERM: 'Kurzfristig'
    }
    return type ? labels[type] || type : '-'
  }

  const getWorkTimeLabel = (model?: string) => {
    const labels: Record<string, string> = {
      FULLTIME_40H: 'Vollzeit 40h',
      FULLTIME_37_5H: 'Vollzeit 37,5h',
      FULLTIME_35H: 'Vollzeit 35h',
      PARTTIME_30H: 'Teilzeit 30h',
      PARTTIME_25H: 'Teilzeit 25h',
      PARTTIME_20H: 'Teilzeit 20h',
      PARTTIME_15H: 'Teilzeit 15h',
      MINIJOB_603: 'Minijob 603€',
      FLEXTIME: 'Gleitzeit',
      TRUST_BASED: 'Vertrauensarbeitszeit'
    }
    return model ? labels[model] || model : '-'
  }

  const getHierarchyLabel = (level: number) => {
    const labels = ['Geschäftsführung', 'Manager', 'Teamleiter', 'Mitarbeiter']
    return labels[level] || 'Mitarbeiter'
  }

  const filteredEmployees = employees.filter(emp => {
    // Exclude admin accounts (role ADMIN or specific email domains)
    if (emp.role === 'ADMIN' || emp.email.includes('admin@bereifung24.de')) {
      return false
    }

    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !filterDepartment || emp.department === filterDepartment
    const matchesEmploymentType = !filterEmploymentType || emp.employmentType === filterEmploymentType

    return matchesSearch && matchesDepartment && matchesEmploymentType
  })

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))] as string[]
  const employmentTypes = [...new Set(employees.map(e => e.employmentType).filter(Boolean))] as string[]

  if (loading) {
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
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Mitarbeiter-Verwaltung</h1>
            <p className="text-gray-600 mt-1">{filteredEmployees.length} Mitarbeiter</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(getEmployeeUrl('/admin/hr/mitarbeiter/neu', session?.user?.role))}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Mitarbeiter
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Suche nach Name, Email, Position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Alle Abteilungen</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterEmploymentType}
            onChange={(e) => setFilterEmploymentType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Alle Beschäftigungsarten</option>
            {employmentTypes.map(type => (
              <option key={type} value={type}>{getEmploymentTypeLabel(type)}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map(employee => (
          <Card 
            key={employee.id} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(getEmployeeUrl(`/admin/hr/mitarbeiter/${employee.id}`, session?.user?.role))}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{employee.firstName} {employee.lastName}</h3>
                  <p className="text-sm text-gray-600">{employee.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${employee.hierarchyLevel === 0 ? 'bg-purple-100 text-purple-700' :
                    employee.hierarchyLevel === 1 ? 'bg-blue-100 text-blue-700' :
                    employee.hierarchyLevel === 2 ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'}
                `}>
                  {getHierarchyLabel(employee.hierarchyLevel)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Abteilung</p>
                  <p className="font-medium">{employee.department || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Position</p>
                  <p className="font-medium">{employee.position || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Arbeitszeit</p>
                  <p className="font-medium">{getWorkTimeLabel(employee.workTimeModel)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Gehalt (brutto)</p>
                  <p className="font-medium">{formatEUR(employee.monthlySalary)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-500">Beschäftigung: </span>
                  <span className="font-medium">{getEmploymentTypeLabel(employee.employmentType)}</span>
                </div>
                {employee.manager && (
                  <div>
                    <span className="text-gray-500">Vorgesetzter: </span>
                    <span className="font-medium">{employee.manager.firstName} {employee.manager.lastName}</span>
                  </div>
                )}
              </div>
              {employee.contractStart && (
                <div className="mt-2 text-xs text-gray-500">
                  Vertrag seit: {new Date(employee.contractStart).toLocaleDateString('de-DE')}
                  {employee.contractEnd && ` bis ${new Date(employee.contractEnd).toLocaleDateString('de-DE')}`}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Keine Mitarbeiter gefunden</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterDepartment || filterEmploymentType
              ? 'Versuche andere Suchkriterien'
              : 'Lege deinen ersten Mitarbeiter an'}
          </p>
          {!searchTerm && !filterDepartment && !filterEmploymentType && (
            <Button
              onClick={() => router.push(getEmployeeUrl('/admin/hr/mitarbeiter/neu', session?.user?.role))}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Mitarbeiter anlegen
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
