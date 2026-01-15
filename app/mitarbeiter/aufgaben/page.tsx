'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckSquare, Plus, Calendar, AlertCircle, Clock, User, Filter, Paperclip, Download, Trash2, Upload, X } from 'lucide-react'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
  position?: string
}

interface TaskAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  createdAt: string
  uploadedBy: {
    firstName: string
    lastName: string
  }
}

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
  assignedTo?: {
    firstName: string
    lastName: string
  }
  attachments?: TaskAttachment[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  TODO: { label: 'Zu erledigen', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'Offen', color: 'bg-gray-100 text-gray-800' },
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
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedToId: '',
    priority: 'MEDIUM',
    category: '',
    dueDate: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (session?.user?.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }
    
    fetchTasks()
    fetchEmployees()
  }, [session, status, router])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employee/list')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
        // Set self as default assignee
        if (session?.user?.id) {
          setNewTask(prev => ({ ...prev, assignedToId: session.user.id }))
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

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

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/employee/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setNewTask({
          title: '',
          description: '',
          assignedToId: session?.user?.id || '',
          priority: 'MEDIUM',
          category: '',
          dueDate: ''
        })
        fetchTasks()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleFileUpload = async (taskId: string, file: File) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    
    if (file.size > MAX_FILE_SIZE) {
      alert('Datei ist zu groß (max. 10MB)')
      return
    }

    setUploading(taskId)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/employee/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        fetchTasks()
        // Reset file input
        if (fileInputRefs.current[taskId]) {
          fileInputRefs.current[taskId]!.value = ''
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Hochladen')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Fehler beim Hochladen der Datei')
    } finally {
      setUploading(null)
    }
  }

  const deleteAttachment = async (taskId: string, attachmentId: string) => {
    if (!confirm('Möchten Sie diese Datei wirklich löschen?')) return

    try {
      const response = await fetch(`/api/employee/tasks/attachments/${attachmentId}/download`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTasks()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Fehler beim Löschen der Datei')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredTasks = filterStatus === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus)

  const todoTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'PENDING').length
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neue Aufgabe
              </button>
              <button
                onClick={() => router.push('/mitarbeiter')}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                ← Zurück
              </button>
            </div>
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
                      
                      {/* File Attachments */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Anhänge ({task.attachments.length})
                          </p>
                          {task.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-gray-900 truncate">{attachment.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(attachment.fileSize)} • {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-2">
                                <a
                                  href={`/api/employee/tasks/attachments/${attachment.id}/download`}
                                  download
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Herunterladen"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => deleteAttachment(task.id, attachment.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Upload */}
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <div className="mt-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                            <input
                              ref={(el) => fileInputRefs.current[task.id] = el}
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(task.id, file)
                              }}
                              disabled={uploading === task.id}
                            />
                            {uploading === task.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>Lädt hoch...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Datei anhängen (max. 10MB)</span>
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Von {task.createdBy.firstName} {task.createdBy.lastName}</span>
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>→ {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                        </div>
                      )}
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

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Neue Aufgabe erstellen</h2>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={createTask} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zugewiesen an <span className="text-red-500">*</span>
                </label>
                <select
                  value={newTask.assignedToId}
                  onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Mitarbeiter auswählen</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} {emp.position ? `(${emp.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorität
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Niedrig</option>
                  <option value="MEDIUM">Mittel</option>
                  <option value="HIGH">Hoch</option>
                  <option value="URGENT">Dringend</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <input
                  type="text"
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Support, Entwicklung, Buchhaltung"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fälligkeitsdatum
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aufgabe erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
