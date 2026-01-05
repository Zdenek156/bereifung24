'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckSquare, Plus, Calendar, AlertCircle, Clock, User, Filter } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  category?: string
  dueDate?: string
  progress: number
  createdAt: string
  createdBy: {
    firstName: string
    lastName: string
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TODO: { label: 'Zu erledigen', color: 'bg-gray-100 text-gray-800' },
  IN_PROGRESS: { label: 'In Arbeit', color: 'bg-blue-100 text-blue-800' },
  REVIEW: { label: 'Überprüfung', color: 'bg-purple-100 text-purple-800' },
  BLOCKED: { label: 'Blockiert', color: 'bg-red-100 text-red-800' },
  COMPLETED: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Abgebrochen', color: 'bg-gray-100 text-gray-500' }
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'border-l-gray-400',
  MEDIUM: 'border-l-blue-500',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-600'
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
    } else {
      fetchTasks()
    }
  }, [session, status, router])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employee/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const filteredTasks = filterStatus === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus)

  const todoTasks = tasks.filter(t => t.status === 'TODO').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-7 h-7 text-blue-600" />
                Meine Aufgaben
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Aufgaben verwalten & Status aktualisieren
              </p>
            </div>
            <button
              onClick={() => router.push('/mitarbeiter')}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              ← Zurück
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offen</p>
                <p className="text-3xl font-bold text-gray-900">{todoTasks}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Arbeit</p>
                <p className="text-3xl font-bold text-blue-600">{inProgressTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Alle Status</option>
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="ml-auto text-sm text-gray-600">
              {filteredTasks.length} Aufgabe{filteredTasks.length !== 1 ? 'n' : ''}
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Lädt Aufgaben...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {filterStatus !== 'ALL' 
                ? 'Keine Aufgaben mit diesem Status' 
                : 'Noch keine Aufgaben vorhanden'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.TODO
              const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColor} p-6`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {task.category && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {task.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Von {task.createdBy.firstName} {task.createdBy.lastName}</span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      )}
                    </div>

                    {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                      <div className="flex gap-2">
                        {task.status === 'TODO' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Starten
                          </button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Abschließen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
