'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Users, Building2, Clock, Euro, FileText, RotateCcw } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getEmployeeUrl } from '@/lib/utils/employeeRoutes'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department?: string
  position?: string
  employmentType?: string
  workTimeModel?: string
  monthlySalary?: number
  contractStart?: string
  contractEnd?: string
  hierarchyLevel: number
  manager?: { firstName: string; lastName: string }
}

export default function EhemaligeMitarbeiterPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/hr/employees?inactive=true')
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

  const handleReactivate = async (employeeId: string) => {
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich wieder aktivieren?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/hr/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      })

      if (response.ok) {
        alert('Mitarbeiter wurde wieder aktiviert!')
        fetchEmployees()
      } else {
        alert('Fehler beim Aktivieren')
      }
    } catch (error) {
      console.error('Error reactivating employee:', error)
      alert('Fehler beim Aktivieren')
    }
  }

  const formatEUR = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getEmploymentTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      FULLTIME: 'Vollzeit',
      PARTTIME: 'Teilzeit',
      MINIJOB: 'Minijob',
      TEMPORARY: 'Befristet'
    }
    return type ? labels[type] || type : '-'
  }

  const getWorkTimeLabel = (model?: string) => {
    const labels: Record<string, string> = {
      FIXED: 'Feste Arbeitszeit',
      FLEXTIME: 'Gleitzeit',
      SHIFT: 'Schichtarbeit',
      MOBILE: 'Mobiles Arbeiten'
    }
    return model ? labels[model] || model : '-'
  }

  const getHierarchyLabel = (level: number) => {
    const labels: Record<number, string> = {
      0: 'Mitarbeiter',
      1: 'Teamleiter',
      2: 'Manager',
      3: 'Geschäftsführer'
    }
    return labels[level] || 'Mitarbeiter'
  }

  const filteredEmployees = employees.filter(emp => {
    // API already filters out admin and system users
    
    const matchesSearch = 
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !filterDepartment || emp.department === filterDepartment

    return matchesSearch && matchesDepartment
  })

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade ehemalige Mitarbeiter...</div>
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
            <h1 className="text-3xl font-bold">Ehemalige Mitarbeiter</h1>
            <p className="text-gray-600">Ausgeschiedene und gekündigte Mitarbeiter</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Name, E-Mail oder Position suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus:ring-0"
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full border-0 focus:ring-0 bg-transparent"
            >
              <option value="">Alle Abteilungen</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-gray-600 p-3 rounded-full">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Ehemalige Mitarbeiter</p>
            <p className="text-2xl font-bold">{filteredEmployees.length}</p>
          </div>
        </div>
      </Card>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map(employee => (
          <Card 
            key={employee.id} 
            className="p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{employee.firstName} {employee.lastName}</h3>
                  <p className="text-sm text-gray-600">{employee.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  {getHierarchyLabel(employee.hierarchyLevel)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {employee.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{employee.department}</span>
                  {employee.position && (
                    <span className="text-gray-400">• {employee.position}</span>
                  )}
                </div>
              )}

              {employee.employmentType && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{getEmploymentTypeLabel(employee.employmentType)}</span>
                  {employee.workTimeModel && (
                    <span className="text-gray-400">• {getWorkTimeLabel(employee.workTimeModel)}</span>
                  )}
                </div>
              )}

              {employee.monthlySalary && (
                <div className="flex items-center gap-2 text-sm">
                  <Euro className="h-4 w-4 text-gray-400" />
                  <span>{formatEUR(employee.monthlySalary)}/Monat</span>
                </div>
              )}

              {employee.manager && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Vorgesetzter: {employee.manager.firstName} {employee.manager.lastName}
                  </span>
                </div>
              )}

              {(employee.contractStart || employee.contractEnd) && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {employee.contractStart && new Date(employee.contractStart).toLocaleDateString('de-DE')}
                    {employee.contractEnd && ` - ${new Date(employee.contractEnd).toLocaleDateString('de-DE')}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(getEmployeeUrl(`/admin/hr/mitarbeiter/${employee.id}/hr-daten`, session?.user?.role))}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Details ansehen
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleReactivate(employee.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reaktivieren
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Keine ehemaligen Mitarbeiter gefunden</h3>
          <p className="text-gray-600">
            {searchTerm || filterDepartment
              ? 'Keine Mitarbeiter entsprechen den Filterkriterien.'
              : 'Es gibt noch keine ausgeschiedenen Mitarbeiter.'}
          </p>
        </Card>
      )}
    </div>
  )
}
