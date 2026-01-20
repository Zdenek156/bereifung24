'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, ChevronDown, ChevronRight } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  position: string
  department: string
  hierarchyLevel: number
  managerId: string | null
  profileImage: string | null
  manager?: {
    firstName: string
    lastName: string
  } | null
  subordinates?: Employee[]
}

export default function HierarchyPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/hr/employees')
      if (response.ok) {
        const result = await response.json()
        const employeeData = result.success ? result.data : result
        buildHierarchy(employeeData)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildHierarchy = (employeeList: Employee[]) => {
    // Create a map of employees by ID
    const employeeMap = new Map<string, Employee>()
    employeeList.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, subordinates: [] })
    })

    // Build parent-child relationships
    const roots: Employee[] = []
    employeeList.forEach(emp => {
      const employee = employeeMap.get(emp.id)!
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const manager = employeeMap.get(emp.managerId)!
        manager.subordinates = manager.subordinates || []
        manager.subordinates.push(employee)
      } else {
        roots.push(employee)
      }
    })

    // Sort by hierarchyLevel (0 = top/Geschäftsführung)
    roots.sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
    roots.forEach(root => sortSubordinates(root))

    setEmployees(roots)
    
    // Expand all top-level nodes by default
    const topLevelIds = new Set(roots.map(r => r.id))
    setExpandedNodes(topLevelIds)
  }

  const sortSubordinates = (employee: Employee) => {
    if (employee.subordinates && employee.subordinates.length > 0) {
      employee.subordinates.sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)
      employee.subordinates.forEach(sortSubordinates)
    }
  }

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getHierarchyLevelLabel = (level: number): string => {
    switch (level) {
      case 0: return 'Geschäftsführung'
      case 1: return 'Management'
      case 2: return 'Team Lead'
      case 3: return 'Senior'
      case 4: return 'Mitarbeiter'
      default: return `Ebene ${level}`
    }
  }

  const getHierarchyLevelColor = (level: number): string => {
    switch (level) {
      case 0: return 'bg-purple-100 text-purple-800 border-purple-300'
      case 1: return 'bg-blue-100 text-blue-800 border-blue-300'
      case 2: return 'bg-green-100 text-green-800 border-green-300'
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const renderEmployee = (employee: Employee, depth: number = 0) => {
    const isExpanded = expandedNodes.has(employee.id)
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0

    return (
      <div key={employee.id} className="mb-2">
        <Card 
          className={`p-4 hover:shadow-md transition-shadow ${depth > 0 ? 'ml-8' : ''}`}
          style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : '0' }}
        >
          <div className="flex items-start gap-4">
            {/* Expand/Collapse Button */}
            <div className="flex-shrink-0 pt-1">
              {hasSubordinates ? (
                <button
                  onClick={() => toggleNode(employee.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-7 h-7"></div>
              )}
            </div>

            {/* Profile Image */}
            <div className="flex-shrink-0">
              {employee.profileImage ? (
                <img 
                  src={employee.profileImage} 
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                  <p className="text-xs text-gray-500">{employee.department}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {employee.email && (
                      <a
                        href={`mailto:${employee.email}`}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{employee.email}</span>
                      </a>
                    )}
                    {employee.phone && (
                      <a
                        href={`tel:${employee.phone}`}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        <Phone className="h-3 w-3" />
                        {employee.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Hierarchy Level Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getHierarchyLevelColor(employee.hierarchyLevel)}`}>
                  {getHierarchyLevelLabel(employee.hierarchyLevel)}
                </div>
              </div>

              {/* Subordinate Count */}
              {hasSubordinates && (
                <div className="mt-2 text-xs text-gray-500">
                  {employee.subordinates!.length} {employee.subordinates!.length === 1 ? 'direkter Mitarbeiter' : 'direkte Mitarbeiter'}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Render Subordinates */}
        {isExpanded && hasSubordinates && (
          <div className="mt-2">
            {employee.subordinates!.map(sub => renderEmployee(sub, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Organigramm...</div>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard applicationKey="hr">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Organigramm</h1>
              <p className="text-gray-600 mt-1">Unternehmenshierarchie & Berichtsstruktur</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={(e) => {
                e.preventDefault()
                console.log('Expanding all nodes...')
                const allIds = new Set<string>()
                const collectIds = (emps: Employee[]) => {
                  emps.forEach(emp => {
                    allIds.add(emp.id)
                    if (emp.subordinates) collectIds(emp.subordinates)
                  })
                }
                collectIds(employees)
                console.log('Expanded nodes:', allIds.size)
                setExpandedNodes(allIds)
              }}
              variant="outline"
              type="button"
            >
              Alle ausklappen
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault()
                console.log('Collapsing all nodes...')
                const topLevelIds = new Set(employees.map(e => e.id))
                console.log('Top level nodes:', topLevelIds.size)
                setExpandedNodes(topLevelIds)
              }}
              variant="outline"
              type="button"
            >
              Alle einklappen
            </Button>
          </div>
        </div>

        {/* Legend */}
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Hierarchie-Ebenen:</h3>
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`px-3 py-1 rounded-full text-xs font-medium border ${getHierarchyLevelColor(level)}`}>
                {getHierarchyLevelLabel(level)}
              </div>
            ))}
          </div>
        </Card>

        {/* Hierarchy Tree */}
        {employees.length > 0 ? (
          <div className="space-y-2">
            {employees.map(emp => renderEmployee(emp))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold">Keine Mitarbeiter gefunden</h2>
              <p className="text-gray-600">
                Es sind noch keine Mitarbeiter im System angelegt.
              </p>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  )
}
