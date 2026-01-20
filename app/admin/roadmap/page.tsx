'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, Plus, ChevronDown, Clock, User, AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

interface RoadmapPhase {
  id: string
  name: string
  description: string | null
  startMonth: string
  endMonth: string
  order: number
  color: string
  tasks: RoadmapTask[]
}

interface RoadmapTask {
  id: string
  title: string
  description: string | null
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  assignedToId: string | null
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  phaseId: string
  phase: {
    id: string
    name: string
    color: string
  }
  month: string
  dueDate: string | null
  startDate: string | null
  category: string | null
  tags: string[]
  completedAt: string | null
  completedBy: {
    id: string
    firstName: string
    lastName: string
  } | null
  blockedReason: string | null
  notes: string | null
}

const priorityConfig = {
  P0_CRITICAL: { label: 'P0 Critical', color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' },
  P1_HIGH: { label: 'P1 High', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🟡' },
  P2_MEDIUM: { label: 'P2 Medium', color: 'bg-green-100 text-green-800 border-green-300', icon: '🟢' },
  P3_LOW: { label: 'P3 Low', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🔵' },
}

const statusConfig = {
  NOT_STARTED: { label: 'Nicht gestartet', icon: Circle, color: 'text-gray-400' },
  IN_PROGRESS: { label: 'In Arbeit', icon: Loader2, color: 'text-blue-500' },
  COMPLETED: { label: 'Erledigt', icon: CheckCircle2, color: 'text-green-500' },
  BLOCKED: { label: 'Blockiert', icon: AlertCircle, color: 'text-red-500' },
}

export default function RoadmapPage() {
  const [phases, setPhases] = useState<RoadmapPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'list'>('timeline')

  useEffect(() => {
    fetchPhases()
  }, [])

  const fetchPhases = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/roadmap/phases')
      if (response.ok) {
        const result = await response.json()
        setPhases(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching phases:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/roadmap/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchPhases()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getFilteredTasks = (tasks: RoadmapTask[]) => {
    return tasks.filter(task => {
      if (selectedEmployee && task.assignedToId !== selectedEmployee) return false
      if (selectedPriority && task.priority !== selectedPriority) return false
      if (selectedStatus && task.status !== selectedStatus) return false
      if (selectedMonth && task.month !== selectedMonth) return false
      return true
    })
  }

  const getEmployees = () => {
    const employeeMap = new Map()
    phases.forEach(phase => {
      phase.tasks.forEach(task => {
        if (task.assignedTo) {
          employeeMap.set(task.assignedTo.id, task.assignedTo)
        }
      })
    })
    return Array.from(employeeMap.values())
  }

  const getMonths = () => {
    const monthSet = new Set<string>()
    phases.forEach(phase => {
      phase.tasks.forEach(task => {
        monthSet.add(task.month)
      })
    })
    return Array.from(monthSet).sort()
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold">Roadmap 2026</h1>
            <p className="text-gray-600">Unternehmensplanung und Meilensteine</p>
          </div>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Person</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedEmployee(null)}>
                Alle Mitarbeiter
              </DropdownMenuItem>
              {getEmployees().map(emp => (
                <DropdownMenuItem
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                >
                  {emp.firstName} {emp.lastName}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priorität</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedPriority(null)}>
                Alle Prioritäten
              </DropdownMenuItem>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSelectedPriority(key)}
                >
                  {config.icon} {config.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                Alle Status
              </DropdownMenuItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSelectedStatus(key)}
                >
                  <config.icon className={`h-4 w-4 mr-2 ${config.color}`} />
                  {config.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Monat</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedMonth(null)}>
                Alle Monate
              </DropdownMenuItem>
              {getMonths().map(month => (
                <DropdownMenuItem
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                >
                  {formatMonth(month)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedEmployee || selectedPriority || selectedStatus || selectedMonth) && (
        <div className="mb-4 flex gap-2 items-center flex-wrap">
          <span className="text-sm text-gray-600">Aktive Filter:</span>
          {selectedEmployee && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEmployee(null)}
            >
              {getEmployees().find(e => e.id === selectedEmployee)?.firstName}
              {' '}
              {getEmployees().find(e => e.id === selectedEmployee)?.lastName}
              <span className="ml-2">×</span>
            </Button>
          )}
          {selectedPriority && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPriority(null)}
            >
              {priorityConfig[selectedPriority as keyof typeof priorityConfig].icon}
              {' '}
              {priorityConfig[selectedPriority as keyof typeof priorityConfig].label}
              <span className="ml-2">×</span>
            </Button>
          )}
          {selectedStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStatus(null)}
            >
              {statusConfig[selectedStatus as keyof typeof statusConfig].label}
              <span className="ml-2">×</span>
            </Button>
          )}
          {selectedMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(null)}
            >
              {formatMonth(selectedMonth)}
              <span className="ml-2">×</span>
            </Button>
          )}
        </div>
      )}

      {/* Timeline View */}
      <div className="space-y-8">
        {phases.map(phase => {
          const filteredTasks = getFilteredTasks(phase.tasks)
          
          if (filteredTasks.length === 0) return null

          return (
            <Card key={phase.id} className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-2 h-12 rounded"
                  style={{ backgroundColor: phase.color }}
                />
                <div>
                  <h2 className="text-2xl font-bold">{phase.name}</h2>
                  <p className="text-gray-600">
                    {formatMonth(phase.startMonth)} - {formatMonth(phase.endMonth)}
                  </p>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  {filteredTasks.length} Aufgaben
                </div>
              </div>

              <div className="space-y-3">
                {filteredTasks.map(task => {
                  const StatusIcon = statusConfig[task.status].icon
                  return (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        task.status === 'COMPLETED' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <StatusIcon
                          className={`h-5 w-5 mt-0.5 ${statusConfig[task.status].color} ${
                            task.status === 'IN_PROGRESS' ? 'animate-spin' : ''
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              {task.description && (
                                <p className="text-gray-600 mt-1 text-sm">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                priorityConfig[task.priority].color
                              }`}
                            >
                              {priorityConfig[task.priority].icon}{' '}
                              {priorityConfig[task.priority].label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            {task.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {task.assignedTo.firstName} {task.assignedTo.lastName}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatMonth(task.month)}
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Fällig: {formatDate(task.dueDate)}
                              </div>
                            )}
                            {task.category && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {task.category}
                              </span>
                            )}
                          </div>

                          {task.blockedReason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              Blockiert: {task.blockedReason}
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  Status ändern
                                  <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <DropdownMenuItem
                                    key={key}
                                    onClick={() => updateTaskStatus(task.id, key)}
                                  >
                                    <config.icon className={`h-4 w-4 mr-2 ${config.color}`} />
                                    {config.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {phases.every(phase => getFilteredTasks(phase.tasks).length === 0) && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Keine Aufgaben gefunden</h2>
            <p className="text-gray-600 mb-4">
              Mit den aktuellen Filtern wurden keine Aufgaben gefunden.
            </p>
            <Button
              onClick={() => {
                setSelectedEmployee(null)
                setSelectedPriority(null)
                setSelectedStatus(null)
                setSelectedMonth(null)
              }}
              variant="outline"
            >
              Filter zurücksetzen
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
