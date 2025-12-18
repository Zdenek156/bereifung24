'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Search, Plus, Edit, Trash2, ArrowLeft, Building2 } from 'lucide-react'

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
  assignedWorkshops?: Array<{
    id: string
    companyName: string
    city: string
  }>
  _count?: {
    assignedWorkshops: number
  }
}

export default function B24EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/b24-employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/b24-employees/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEmployees(employees.filter(emp => emp.id !== id))
      } else {
        alert('Fehler beim Löschen des Mitarbeiters')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Fehler beim Löschen des Mitarbeiters')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const employee = employees.find(emp => emp.id === id)
      if (!employee) return

      const response = await fetch(`/api/admin/b24-employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...employee,
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        const updatedEmployee = await response.json()
        setEmployees(employees.map(emp =>
          emp.id === id ? updatedEmployee : emp
        ))
      }
    } catch (error) {
      console.error('Error toggling employee status:', error)
    }
  }

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' ||
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === '' ||
      emp.department === departmentFilter

    return matchesSearch && matchesDepartment
  })

  // Get unique departments
  const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)))

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Bereifung24 Mitarbeiter</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre internen Mitarbeiter mit Zugriffsrechten
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/admin')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button onClick={() => router.push('/admin/b24-employees/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Mitarbeiter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Suche nach Name oder Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">Alle Abteilungen</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Laden...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Mitarbeiter gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '200px' }}>Name</TableHead>
                  <TableHead style={{ width: '200px' }}>Email</TableHead>
                  <TableHead style={{ width: '120px' }}>Position</TableHead>
                  <TableHead style={{ width: '120px' }}>Abteilung</TableHead>
                  <TableHead style={{ width: '100px' }}>Workshops</TableHead>
                  <TableHead style={{ width: '100px' }}>Status</TableHead>
                  <TableHead style={{ width: '150px' }} className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position || '-'}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{employee._count?.assignedWorkshops || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.isActive ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(employee.id, employee.isActive)}
                      >
                        {employee.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/b24-employees/${employee.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
