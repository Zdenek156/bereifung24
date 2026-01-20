'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2, ChevronDown } from 'lucide-react'
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
    startMonth: string
    endMonth: string
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

export default function MyRoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchMyTasks()
  }, [statusFilter])

  const fetchMyTasks = async () => {
    setLoading(true)
    try {
      const url = statusFilter
        ? `/api/mitarbeiter/roadmap/my-tasks?status=${statusFilter}`
        : '/api/mitarbeiter/roadmap/my-tasks'
      
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setTasks(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching my tasks:', error)
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
        fetchMyTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
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
    return new Date(task.dueDate) < new Date()
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter: {statusFilter ? statusConfig[statusFilter as keyof typeof statusConfig].label : 'Alle'}
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
                ? `Du hast keine Aufgaben mit dem Status "${statusConfig[statusFilter as keyof typeof statusConfig].label}".`
                : 'Du hast momentan keine Aufgaben zugewiesen.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const StatusIcon = statusConfig[task.status].icon
            const overdue = isOverdue(task)
            
            return (
              <Card
                key={task.id}
                className={`p-4 hover:shadow-md transition-shadow ${
                  task.status === 'COMPLETED' ? 'opacity-60' : ''
                } ${overdue ? 'border-red-300' : ''}`}
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
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded"
                        style={{ backgroundColor: `${task.phase.color}20` }}
                      >
                        {task.phase.name}
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
    </div>
  )
}
