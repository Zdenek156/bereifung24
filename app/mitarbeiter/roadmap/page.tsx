'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2, ChevronDown, Plus, Edit2, Users, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import TaskEditModal from '@/components/TaskEditModal'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RoadmapPhase {
  id: string
  name: string
  color: string
  startMonth: string
  endMonth: string
}

interface RoadmapTask {
  id: string
  title: string
  description: string | null
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  phase: RoadmapPhase | null
  phaseId: string
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

interface Permissions {
  canCreateTasks: boolean
  canEditTasks: boolean
  isCEO: boolean
}

const priorityConfig = {
  P0: { label: 'P0 Critical', color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' },
  P1: { label: 'P1 High', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '🟡' },
  P2: { label: 'P2 Medium', color: 'bg-green-100 text-green-800 border-green-300', icon: '🟢' },
  P3: { label: 'P3 Low', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🔵' },
}

const statusConfig = {
  NOT_STARTED: { label: 'Nicht gestartet', icon: Circle, color: 'text-gray-400' },
  IN_PROGRESS: { label: 'In Arbeit', icon: Loader2, color: 'text-blue-500' },
  COMPLETED: { label: 'Erledigt', icon: CheckCircle2, color: 'text-green-500' },
  BLOCKED: { label: 'Blockiert', icon: AlertCircle, color: 'text-red-500' },
}

// CRITICAL SAFETY: Check if phase has all required properties
function isValidPhase(phase: any): phase is RoadmapPhase {
  return !!(
    phase &&
    typeof phase === 'object' &&
    typeof phase.id === 'string' &&
    typeof phase.name === 'string' &&
    typeof phase.color === 'string' &&
    phase.color.length > 0
  )
}

// CRITICAL SAFETY: Check if task is valid and has valid phase
function isValidTask(task: any): task is RoadmapTask {
  return !!(
    task &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    isValidPhase(task.phase)
  )
}

export default function MyRoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [helpTaskId, setHelpTaskId] = useState<string | null>(null)

  useEffect(() => {
    fetchMyTasks()
    fetchPermissions()
  }, [statusFilter])

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

  const fetchMyTasks = async () => {
    setLoading(true)
    try {
      const url = statusFilter
        ? `/api/mitarbeiter/roadmap/my-tasks?status=${statusFilter}`
        : '/api/mitarbeiter/roadmap/my-tasks'
      
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        const rawTasks = Array.isArray(result.data) ? result.data : []
        
        // CRITICAL FILTER: Only keep tasks with VALID phase data
        const validTasks = rawTasks.filter(isValidTask)
        
        console.log(`Fetched ${rawTasks.length} tasks, ${validTasks.length} valid`)
        setTasks(validTasks)
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/mitarbeiter/roadmap/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchMyTasks()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Aktualisieren des Status')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Fehler beim Aktualisieren des Status')
    }
  }

  const offerHelp = async (taskId: string, message: string) => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/help-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, message })
      })
      if (response.ok) {
        alert('Deine Hilfe wurde angeboten!')
        setHelpModalOpen(false)
        setHelpTaskId(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Anbieten von Hilfe')
      }
    } catch (error) {
      console.error('Error offering help:', error)
      alert('Fehler beim Anbieten von Hilfe')
    }
  }

  const formatMonth = (month: string) => {
    try {
      const [year, monthNum] = month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1)
      return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    } catch {
      return month
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getStatusCounts = () => {
    return {
      notStarted: tasks.filter(t => t.status === 'NOT_STARTED').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      blocked: tasks.filter(t => t.status === 'BLOCKED').length,
    }
  }

  const isOverdue = (task: RoadmapTask) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false
    try {
      return new Date(task.dueDate) < new Date()
    } catch {
      return false
    }
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

  const counts = getStatusCounts()

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Meine Aufgaben</h1>
            <p className="text-gray-600">Roadmap 2026 - Persönliche Übersicht</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/mitarbeiter/roadmap/team">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Team Übersicht
            </Button>
          </Link>
          <Link href="/mitarbeiter/roadmap/stats">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiken
            </Button>
          </Link>
          {permissions?.canCreateTasks && (
            <Button
              onClick={() => {
                setTaskModalMode('create')
                setSelectedTask(null)
                setTaskModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Aufgabe
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {statusFilter ? statusConfig[statusFilter as keyof typeof statusConfig]?.label || 'Alle' : 'Alle'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                Alle Aufgaben
              </DropdownMenuItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setStatusFilter(key)}
                >
                  <config.icon className={`h-4 w-4 mr-2 ${config.color}`} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nicht gestartet</p>
              <p className="text-2xl font-bold">{counts.notStarted}</p>
            </div>
            <Circle className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Arbeit</p>
              <p className="text-2xl font-bold">{counts.inProgress}</p>
            </div>
            <Loader2 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Erledigt</p>
              <p className="text-2xl font-bold">{counts.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blockiert</p>
              <p className="text-2xl font-bold">{counts.blocked}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Keine offenen Aufgaben</h2>
            <p className="text-gray-600">
              {statusFilter
                ? `Du hast keine Aufgaben mit dem Status "${statusConfig[statusFilter as keyof typeof statusConfig]?.label || 'unbekannt'}".`
                : 'Du hast momentan keine Aufgaben zugewiesen.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            // DEFENSIVE: This should never happen due to filter, but extra safety
            if (!isValidTask(task)) {
              console.warn('Invalid task in render:', task?.id)
              return null
            }

            const StatusIcon = statusConfig[task.status]?.icon || Circle
            const overdue = isOverdue(task)
            const phaseColor = task.phase.color
            const phaseName = task.phase.name
            
            return (
              <Card
                key={task.id}
                className={`p-4 hover:shadow-md transition-shadow ${
                  task.status === 'COMPLETED' ? 'opacity-60' : ''
                } ${overdue ? 'border-red-300' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <StatusIcon
                    className={`h-5 w-5 mt-0.5 ${statusConfig[task.status]?.color || 'text-gray-400'} ${
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
                          priorityConfig[task.priority]?.color || 'bg-gray-100'
                        }`}
                      >
                        {priorityConfig[task.priority]?.icon || ''}{' '}
                        {priorityConfig[task.priority]?.label || task.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded"
                        style={{ backgroundColor: `${phaseColor}20` }}
                      >
                        {phaseName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatMonth(task.month)}
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                          <Clock className="h-4 w-4" />
                          Fällig: {formatDate(task.dueDate)}
                          {overdue && <span className="ml-1">⚠️</span>}
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

                    {task.notes && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <strong>Notizen:</strong> {task.notes}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      {/* Jeder Mitarbeiter kann seine eigenen Tasks bearbeiten */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTaskModalMode('edit')
                          setSelectedTask(task)
                          setTaskModalOpen(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-blue-50 hover:bg-blue-100"
                        onClick={() => {
                          setHelpTaskId(task.id)
                          setHelpModalOpen(true)
                        }}
                      >
                        🤝 Hilfe anbieten
                      </Button>
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
              </Card>
            )
          })}
        </div>
      )}
      
      <TaskEditModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setSelectedTask(null)
        }}
        onSuccess={() => {
          fetchMyTasks()
        }}
        task={selectedTask}
        mode={taskModalMode}
      />

      {/* Hilfe anbieten Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Hilfe anbieten</h3>
            <p className="text-gray-600 mb-4">
              Möchtest du bei dieser Aufgabe helfen? Schreibe eine kurze Nachricht:
            </p>
            <textarea
              id="help-message"
              className="w-full border rounded p-2 mb-4"
              rows={4}
              placeholder="Ich kann bei dieser Aufgabe helfen mit..."
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setHelpModalOpen(false)
                  setHelpTaskId(null)
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  const textarea = document.getElementById('help-message') as HTMLTextAreaElement
                  const message = textarea?.value || 'Ich möchte bei dieser Aufgabe helfen.'
                  if (helpTaskId) {
                    offerHelp(helpTaskId, message)
                  }
                }}
              >
                Hilfe anbieten
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
