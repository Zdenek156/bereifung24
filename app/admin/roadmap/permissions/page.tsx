'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import { CheckCircle2, Circle, Shield, User } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  position: string | null
  canCreateTasks: boolean
  canEditTasks: boolean
  isCEO: boolean
}

export default function RoadmapPermissionsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/roadmap/permissions')
      if (response.ok) {
        const result = await response.json()
        setEmployees(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (
    employeeId: string,
    field: 'canCreateTasks' | 'canEditTasks',
    currentValue: boolean
  ) => {
    setSaving(employeeId)
    try {
      const employee = employees.find(e => e.id === employeeId)!
      
      const response = await fetch('/api/admin/roadmap/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          canCreateTasks: field === 'canCreateTasks' ? !currentValue : employee.canCreateTasks,
          canEditTasks: field === 'canEditTasks' ? !currentValue : employee.canEditTasks
        })
      })

      if (response.ok) {
        setEmployees(prev => prev.map(emp => 
          emp.id === employeeId 
            ? { ...emp, [field]: !currentValue }
            : emp
        ))
      }
    } catch (error) {
      console.error('Error updating permission:', error)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Berechtigungen...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">Roadmap Berechtigungen</h1>
          <p className="text-gray-600 mt-1">
            Legen Sie fest, wer Tasks erstellen und bearbeiten darf
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Berechtigungshinweis</p>
              <p className="text-sm text-blue-700 mt-1">
                • Geschäftsführer haben automatisch ALLE Rechte (Admin-Level)
                <br />
                • Mitarbeiter können nur ihre eigenen Tasks bearbeiten
                <br />
                • Alle Mitarbeiter können Team-Übersicht sehen
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Mitarbeiter</th>
                <th className="text-left p-3 font-semibold">Position</th>
                <th className="text-center p-3 font-semibold">Tasks erstellen</th>
                <th className="text-center p-3 font-semibold">Tasks bearbeiten</th>
                <th className="text-center p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {employee.isCEO && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                        <Shield className="h-3 w-3" />
                        Geschäftsführer
                      </span>
                    )}
                    {!employee.isCEO && (
                      <span className="text-gray-600">{employee.position || 'Mitarbeiter'}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {employee.isCEO ? (
                      <span className="text-purple-600 font-semibold">Immer</span>
                    ) : (
                      <button
                        onClick={() => togglePermission(employee.id, 'canCreateTasks', employee.canCreateTasks)}
                        disabled={saving === employee.id}
                        className="inline-flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100"
                      >
                        {employee.canCreateTasks ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-300" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {employee.isCEO ? (
                      <span className="text-purple-600 font-semibold">Immer</span>
                    ) : (
                      <button
                        onClick={() => togglePermission(employee.id, 'canEditTasks', employee.canEditTasks)}
                        disabled={saving === employee.id}
                        className="inline-flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100"
                      >
                        {employee.canEditTasks ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-300" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {employee.isCEO ? (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        Volle Rechte
                      </span>
                    ) : employee.canCreateTasks || employee.canEditTasks ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Aktiv
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        Nur ansehen
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Keine Mitarbeiter mit Roadmap-Zugriff gefunden
          </div>
        )}
      </Card>
    </div>
  )
}
