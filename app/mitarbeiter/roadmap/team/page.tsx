'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2, Users, LayoutGrid, List } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
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
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW'
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
}

const priorityConfig = {
  P0_CRITICAL: { label: 'P0', color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' },
  P1_HIGH: { label: 'P1', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🟡' },
  P2_MEDIUM: { label: 'P2', color: 'bg-green-100 text-green-800 border-green-300', icon: '🟢' },
  P3_LOW: { label: 'P3', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🔵' },
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
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban'>('timeline')
  
  // Filter
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [selectedEmployee, selectedPriority, selectedStatus, selectedMonth])

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
          new Set(result.data.map((t: RoadmapTask) => t.assignedTo).filter(Boolean))
        ).map((emp: any) => ({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`
        }))
        setEmployees(uniqueEmployees as Employee[])
      }
    } catch (error) {
      console.error('Error fetching team tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedEmployee(null)
    setSelectedPriority(null)
    setSelectedStatus(null)
    setSelectedMonth(null)
  }

  const groupTasksByPhase = () => {
    const grouped = tasks.reduce((acc, task) => {
      // Skip tasks without phase or without phase.color
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

  const groupTasksByStatus = () => {
    return {
      NOT_STARTED: tasks.filter(t => t.status === 'NOT_STARTED'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      COMPLETED: tasks.filter(t => t.status === 'COMPLETED'),
      BLOCKED: tasks.filter(t => t.status === 'BLOCKED'),
    }
  }

  const TaskCard = ({ task }: { task: RoadmapTask }) => {
    const StatusIcon = statusConfig[task.status].icon
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${priorityConfig[task.priority].color}`}>
                {priorityConfig[task.priority].icon} {priorityConfig[task.priority].label}
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

            <div className="flex items-center gap-4 text-xs text-gray-500">
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
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Blockiert:</strong> {task.blockedReason}
              </div>
            )}

            {task.helpOffers.length > 0 && (
              <div className="mt-2 text-xs text-green-600">
                💚 {task.helpOffers.length} Hilfsangebot(e) verfügbar
              </div>
            )}
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
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            onClick={() => setViewMode('timeline')}
          >
            <List className="h-4 w-4 mr-2" />
            Timeline
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
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

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {groupTasksByPhase().map(({ phase, tasks }) => (
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
                <span className="text-gray-500">({tasks.length} Tasks)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(groupTasksByStatus()).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                {React.createElement(statusConfig[status as keyof typeof statusConfig].icon, {
                  className: `h-5 w-5 ${statusConfig[status as keyof typeof statusConfig].color}`
                })}
                <h3 className="font-semibold">
                  {statusConfig[status as keyof typeof statusConfig].label}
                </h3>
                <span className="text-sm text-gray-500">({statusTasks.length})</span>
              </div>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
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
    </div>
  )
}
