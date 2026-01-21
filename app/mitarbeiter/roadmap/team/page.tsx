'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2, Users, Edit2, HandHeart, TrendingUp, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import TaskEditModal from '@/components/TaskEditModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RoadmapTask {
  id: string
  title: string
  description: string | null
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  phase: {
    id: string
    name: string
    color: string
  } | null
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    position: string | null
  } | null
  assignedToId: string | null
  dueDate: string | null
  month: string
  category: string | null
  blockedReason: string | null
  helpOffers: Array<{
    id: string
    status: string
    helper: {
      firstName: string
      lastName: string
    }
  }>
}

interface Employee {
  id: string
  name: string
  firstName: string
  lastName: string
}

interface EmployeeStats {
  employee: Employee
  notStarted: number
  inProgress: number
  completed: number
  blocked: number
  total: number
  completionRate: number
}

interface Permissions {
  canCreateTasks: boolean
  canEditTasks: boolean
  isCEO: boolean
}

const priorityConfig = {
  P0: { label: 'P0', color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' },
  P1: { label: 'P1', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🟡' },
  P2: { label: 'P2', color: 'bg-green-100 text-green-800 border-green-300', icon: '🟢' },
  P3: { label: 'P3', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🔵' },
}

const statusConfig = {
  NOT_STARTED: { label: 'Nicht gestartet', icon: Circle, color: 'text-gray-400' },
  IN_PROGRESS: { label: 'In Arbeit', icon: Loader2, color: 'text-blue-500' },
  COMPLETED: { label: 'Erledigt', icon: CheckCircle2, color: 'text-green-500' },
  BLOCKED: { label: 'Blockiert', icon: AlertCircle, color: 'text-red-500' },
}

export default function TeamRoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'stats'>('stats')
  
  // Task editing
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null)
  
  // Filter
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
    fetchPermissions()
  }, [selectedEmployee, selectedPriority, selectedStatus, selectedMonth])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/my-permissions')
      if (response.ok) {
        const result = await response.json()
        setPermissions(result.data || null)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedEmployee) params.append('assignedToId', selectedEmployee)
      if (selectedPriority) params.append('priority', selectedPriority)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedMonth) params.append('month', selectedMonth)

      const response = await fetch(`/api/mitarbeiter/roadmap/team-tasks?${params}`)
      if (response.ok) {
        const result = await response.json()
        // Sanitize tasks to ensure phase has all required properties
        const validTasks = (result.data || []).map((task: RoadmapTask) => ({
          ...task,
          phase: (task.phase && typeof task.phase === 'object' && 'color' in task.phase && 'name' in task.phase && task.phase.color && task.phase.name) ? task.phase : null
        }))
        setTasks(validTasks)
        
        // Extract unique employees
        const uniqueEmployees = Array.from(
          new Map(
            result.data
              .filter((t: RoadmapTask) => t.assignedTo)
              .map((t: RoadmapTask) => [
                t.assignedTo!.id,
                {
                  id: t.assignedTo!.id,
                  name: `${t.assignedTo!.firstName} ${t.assignedTo!.lastName}`,
                  firstName: t.assignedTo!.firstName,
                  lastName: t.assignedTo!.lastName
                }
              ])
          ).values()
        ) as Employee[]
        setEmployees(uniqueEmployees)
      }
    } catch (error) {
      console.error('Error fetching team tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const offerHelp = async (taskId: string) => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/help-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })
      if (response.ok) {
        alert('✅ Hilfsangebot wurde erfolgreich übermittelt!')
        fetchTasks()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Konnte Hilfsangebot nicht erstellen'}`)
      }
    } catch (error) {
      console.error('Error offering help:', error)
      alert('Fehler beim Anbieten von Hilfe')
    }
  }

  const clearFilters = () => {
    setSelectedEmployee(null)
    setSelectedPriority(null)
    setSelectedStatus(null)
    setSelectedMonth(null)
  }

  const getEmployeeStats = (): EmployeeStats[] => {
    return employees.map(emp => {
      const empTasks = tasks.filter(t => t.assignedToId === emp.id)
      const notStarted = empTasks.filter(t => t.status === 'NOT_STARTED').length
      const inProgress = empTasks.filter(t => t.status === 'IN_PROGRESS').length
      const completed = empTasks.filter(t => t.status === 'COMPLETED').length
      const blocked = empTasks.filter(t => t.status === 'BLOCKED').length
      const total = empTasks.length
      const completionRate = total > 0 ? (completed / total) * 100 : 0

      return {
        employee: emp,
        notStarted,
        inProgress,
        completed,
        blocked,
        total,
        completionRate
      }
    }).sort((a, b) => b.completionRate - a.completionRate)
  }

  const groupTasksByPhase = () => {
    const grouped = tasks.reduce((acc, task) => {
      if (!task.phase || !task.phase.color || !task.phase.name) return acc
      
      if (!acc[task.phase.id]) {
        acc[task.phase.id] = {
          phase: task.phase,
          tasks: []
        }
      }
      acc[task.phase.id].tasks.push(task)
      return acc
    }, {} as Record<string, { phase: any, tasks: RoadmapTask[] }>)

    return Object.values(grouped).sort((a, b) => 
      a.phase.name.localeCompare(b.phase.name)
    )
  }

  const TaskCard = ({ task }: { task: RoadmapTask }) => {
    // Safety check
    if (!task || !task.status || !statusConfig[task.status]) {
      return null
    }

    const StatusIcon = statusConfig[task.status].icon
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${priorityConfig[task.priority]?.color || 'bg-gray-100'}`}>
                {priorityConfig[task.priority]?.icon || ''} {priorityConfig[task.priority]?.label || task.priority}
              </span>
              <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
            </div>
            
            <h3 className={`font-medium mb-1 ${isOverdue ? 'text-red-600' : ''}`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {task.assignedTo && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                  {task.assignedTo.position && (
                    <span className="text-gray-400">({task.assignedTo.position})</span>
                  )}
                </div>
              )}
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {task.category && (
                <span className="px-2 py-0.5 bg-gray-100 rounded">{task.category}</span>
              )}
            </div>

            {task.blockedReason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-2">
                <strong>Blockiert:</strong> {task.blockedReason}
              </div>
            )}

            {task.helpOffers && task.helpOffers.length > 0 && (
              <div className="mt-2 text-xs text-green-600 mb-2">
                💚 {task.helpOffers.length} Hilfsangebot(e) verfügbar
              </div>
            )}

            <div className="flex gap-2 mt-2">
              {permissions?.canEditTasks && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTaskModalMode('edit')
                    setSelectedTask(task)
                    setTaskModalOpen(true)
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Bearbeiten
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:bg-green-50 border-green-300"
                onClick={() => offerHelp(task.id)}
              >
                <HandHeart className="h-3 w-3 mr-1" />
                Hilfe anbieten
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
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

  const employeeStats = getEmployeeStats()

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Team Roadmap
          </h1>
          <p className="text-gray-600 mt-1">
            Alle Tasks des Teams im Überblick - {tasks.length} Aufgaben
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'stats' ? 'default' : 'outline'}
            onClick={() => setViewMode('stats')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Mitarbeiter Statistik
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            onClick={() => setViewMode('timeline')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Phasen Timeline
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Mitarbeiter: {selectedEmployee ? employees.find(e => e.id === selectedEmployee)?.name : 'Alle'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedEmployee(null)}>Alle</DropdownMenuItem>
            {employees.map(emp => (
              <DropdownMenuItem key={emp.id} onClick={() => setSelectedEmployee(emp.id)}>
                {emp.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Priority: {selectedPriority || 'Alle'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedPriority(null)}>Alle</DropdownMenuItem>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => setSelectedPriority(key)}>
                {config.icon} {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status: {selectedStatus ? statusConfig[selectedStatus as keyof typeof statusConfig].label : 'Alle'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedStatus(null)}>Alle</DropdownMenuItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => setSelectedStatus(key)}>
                <config.icon className={`h-4 w-4 mr-2 ${config.color}`} />
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(selectedEmployee || selectedPriority || selectedStatus || selectedMonth) && (
          <Button variant="ghost" onClick={clearFilters}>
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Employee Statistics View */}
      {viewMode === 'stats' && (
        <div className="space-y-4">
          {employeeStats.map(stat => (
            <Card key={stat.employee.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {stat.employee.firstName[0]}{stat.employee.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{stat.employee.name}</h3>
                    <p className="text-sm text-gray-600">{stat.total} Tasks gesamt</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className={`h-6 w-6 ${stat.completionRate >= 80 ? 'text-yellow-500' : stat.completionRate >= 50 ? 'text-blue-500' : 'text-gray-400'}`} />
                  <span className="text-3xl font-bold">{Math.round(stat.completionRate)}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-8 bg-gray-100 rounded-lg overflow-hidden mb-4">
                <div 
                  className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                  style={{ width: `${stat.completionRate}%` }}
                />
                {stat.inProgress > 0 && (
                  <div 
                    className="absolute top-0 h-full bg-blue-500 transition-all"
                    style={{ 
                      left: `${stat.completionRate}%`,
                      width: `${(stat.inProgress / stat.total) * 100}%` 
                    }}
                  />
                )}
                {stat.blocked > 0 && (
                  <div 
                    className="absolute top-0 h-full bg-red-500 transition-all"
                    style={{ 
                      left: `${stat.completionRate + (stat.inProgress / stat.total) * 100}%`,
                      width: `${(stat.blocked / stat.total) * 100}%` 
                    }}
                  />
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-700">{stat.completed}</div>
                  <div className="text-xs text-gray-600">Erledigt</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-blue-700">{stat.inProgress}</div>
                  <div className="text-xs text-gray-600">In Arbeit</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Circle className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-700">{stat.notStarted}</div>
                  <div className="text-xs text-gray-600">Offen</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-700">{stat.blocked}</div>
                  <div className="text-xs text-gray-600">Blockiert</div>
                </div>
              </div>

              {/* Show Tasks for this employee */}
              {tasks.filter(t => t.assignedToId === stat.employee.id).length > 0 && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedEmployee === stat.employee.id) {
                        setSelectedEmployee(null)
                      } else {
                        setSelectedEmployee(stat.employee.id)
                      }
                    }}
                  >
                    {selectedEmployee === stat.employee.id ? 'Alle anzeigen' : 'Tasks anzeigen'}
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {employeeStats.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Keine Mitarbeiter gefunden</h3>
              <p className="text-gray-600">
                Es sind noch keine Tasks an Mitarbeiter zugewiesen
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Phase Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {groupTasksByPhase().map(({ phase, tasks: phaseTasks }) => (
            <div key={phase.id}>
              <div 
                className="flex items-center gap-3 mb-4 pb-2 border-b-2"
                style={{ borderColor: phase?.color || '#gray' }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: phase?.color || '#gray' }}
                />
                <h2 className="text-xl font-bold">{phase.name}</h2>
                <span className="text-gray-500">({phaseTasks.length} Tasks)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phaseTasks.map(task => {
                  // Extra safety check
                  if (!task || !task.id) return null
                  return <TaskCard key={task.id} task={task} />
                })}
              </div>
            </div>
          ))}
          
          {groupTasksByPhase().length === 0 && (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Keine Phasen gefunden</h3>
              <p className="text-gray-600">
                Es sind noch keine Tasks in Phasen vorhanden
              </p>
            </Card>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Tasks gefunden</h3>
          <p className="text-gray-600">
            {selectedEmployee || selectedPriority || selectedStatus
              ? 'Versuchen Sie, die Filter anzupassen'
              : 'Das Team hat noch keine Tasks'}
          </p>
        </Card>
      )}

      <TaskEditModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onSuccess={() => {
          fetchTasks()
        }}
        task={selectedTask}
        mode={taskModalMode}
      />
    </div>
  )
}
