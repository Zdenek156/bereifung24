'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useRouter } from 'next/navigation'
import * as Icons from 'lucide-react'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  position?: string
  isActive: boolean
  role?: string
}

interface Application {
  id: string
  key: string
  name: string
  description?: string
  icon: string
  color: string
  category: string
  sortOrder: number
}

interface EmployeeApplication {
  employeeId: string
  applicationKey: string
  assignedAt: string
  assignedBy: string
}

export default function ApplicationsAssignmentPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch employees
      const empResponse = await fetch('/api/admin/hr/employees')
      let empData: Employee[] = []
      
      if (empResponse.ok) {
        const empResult = await empResponse.json()
        empData = empResult.data || []
        setEmployees(empData)
      }

      // Fetch applications
      const appResponse = await fetch('/api/admin/applications')
      if (appResponse.ok) {
        const appResult = await appResponse.json()
        setApplications(appResult.data || [])
      }

      // Fetch assignments for each employee
      const assignmentsData: Record<string, string[]> = {}
      
      for (const emp of empData) {
        const assignResponse = await fetch(
          `/api/admin/hr/employee-applications/${emp.id}`
        )
        if (assignResponse.ok) {
          const assignResult = await assignResponse.json()
          assignmentsData[emp.id] = (assignResult.data || []).map(
            (app: Application) => app.key
          )
        }
      }
      
      setAssignments(assignmentsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasApplication = (employeeId: string, appKey: string) => {
    return assignments[employeeId]?.includes(appKey) || false
  }

  const toggleApplication = async (employeeId: string, appKey: string) => {
    const key = `${employeeId}-${appKey}`
    setProcessing(key)

    try {
      const hasApp = hasApplication(employeeId, appKey)
      const method = hasApp ? 'DELETE' : 'POST'
      
      const response = await fetch(
        `/api/admin/hr/employee-applications/${employeeId}`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationKey: appKey })
        }
      )

      if (response.ok) {
        // Update local state
        setAssignments((prev) => {
          const current = prev[employeeId] || []
          const updated = hasApp
            ? current.filter((k) => k !== appKey)
            : [...current, appKey]
          return { ...prev, [employeeId]: updated }
        })
      }
    } catch (error) {
      console.error('Error toggling application:', error)
    } finally {
      setProcessing(null)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? (
      <IconComponent className="h-4 w-4" />
    ) : (
      <Icons.Settings className="h-4 w-4" />
    )
  }

  const getColorClasses = (color: string, active: boolean) => {
    if (!active) {
      return 'bg-gray-100 border-gray-300 text-gray-500'
    }
    const colors: Record<string, string> = {
      blue: 'bg-blue-500 border-blue-600 text-white',
      green: 'bg-green-500 border-green-600 text-white',
      orange: 'bg-orange-500 border-orange-600 text-white',
      purple: 'bg-purple-500 border-purple-600 text-white',
      pink: 'bg-pink-500 border-pink-600 text-white',
      yellow: 'bg-yellow-500 border-yellow-600 text-white',
      red: 'bg-red-500 border-red-600 text-white',
      indigo: 'bg-indigo-500 border-indigo-600 text-white',
      cyan: 'bg-cyan-500 border-cyan-600 text-white',
      gray: 'bg-gray-500 border-gray-600 text-white'
    }
    return colors[color] || colors.gray
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      GENERAL: 'Allgemein',
      ACCOUNTING: 'Buchhaltung',
      HR: 'Personal',
      SALES: 'Vertrieb',
      SUPPORT: 'Support'
    }
    return labels[category] || category
  }

  const groupedApps = applications.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = []
    }
    acc[app.category].push(app)
    return acc
  }, {} as Record<string, Application[]>)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Zuweisungen...</div>
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
            <h1 className="text-3xl font-bold">Anwendungszuweisungen</h1>
            <p className="text-gray-600 mt-1">
              Verwalte welche Mitarbeiter Zugriff auf welche Anwendungen haben
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {employees
          .filter((emp) => emp.isActive)
          .filter((emp) => emp.role !== 'ADMIN' && !emp.email.includes('admin@bereifung24.de'))
          .map((employee) => (
            <Card key={employee.id} className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  {employee.position || employee.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {assignments[employee.id]?.length || 0} von{' '}
                  {applications.length} Anwendungen zugewiesen
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedApps).map(([category, apps]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {getCategoryLabel(category)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {apps.map((app) => {
                        const isAssigned = hasApplication(
                          employee.id,
                          app.key
                        )
                        const key = `${employee.id}-${app.key}`
                        const isProcessing = processing === key

                        return (
                          <Button
                            key={app.key}
                            onClick={() =>
                              toggleApplication(employee.id, app.key)
                            }
                            disabled={isProcessing}
                            variant="outline"
                            className={`${getColorClasses(
                              app.color,
                              isAssigned
                            )} border-2 ${
                              isProcessing ? 'opacity-50' : ''
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {getIcon(app.icon)}
                              <span>{app.name}</span>
                              {isAssigned && (
                                <Check className="h-4 w-4" />
                              )}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </div>

      {employees.filter((emp) => emp.isActive && emp.role !== 'ADMIN' && !emp.email.includes('admin@bereifung24.de')).length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold">Keine aktiven Mitarbeiter</h2>
            <p className="text-gray-600">
              Es sind keine aktiven Mitarbeiter im System vorhanden.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
