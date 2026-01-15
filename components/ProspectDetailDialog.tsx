'use client'

import { X, Star, MapPin, Phone, Globe, Clock, Euro, ExternalLink, TrendingUp, StickyNote, CheckSquare, Activity, Plus, Send, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProspectDetail {
  placeId: string
  name: string
  address: string
  city: string
  postalCode: string
  lat: number
  lng: number
  rating?: number
  reviewCount: number
  photoUrls?: string[]
  phone?: string
  website?: string
  openingHours?: string[]
  priceLevel?: number
  leadScore: number
  leadScoreBreakdown?: {
    label: string
    points: number
  }[]
  // Extended for imported prospects
  id?: string
  status?: string
  priority?: string
  notes?: Array<{
    id: string
    content: string
    isPinned: boolean
    createdAt: string
    createdBy: {
      firstName: string
      lastName: string
    }
  }>
  tasks?: Array<{
    id: string
    title: string
    description?: string
    dueDate: string
    priority: string
    status: string
    completed: boolean
    assignedTo: {
      id: string
      firstName: string
      lastName: string
    }
  }>
  interactions?: Array<{
    id: string
    type: string
    notes: string
    outcome?: string
    channel?: string
    createdAt: string
    createdBy: {
      firstName: string
      lastName: string
    }
  }>
}

interface ProspectDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  prospect: ProspectDetail | null
  onImport?: () => void
  onRefresh?: () => void
}

export default function ProspectDetailDialog({ 
  isOpen, 
  onClose, 
  prospect,
  onImport,
  onRefresh 
}: ProspectDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'tasks' | 'activity'>('info')
  const [noteContent, setNoteContent] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskPriority, setTaskPriority] = useState('MEDIUM')
  const [taskAssignedTo, setTaskAssignedTo] = useState('')
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Load employees for task assignment
      if (prospect?.id) {
        fetchEmployees()
      }
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, prospect?.id])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employee/list')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim() || !prospect?.id) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent })
      })
      
      if (response.ok) {
        setNoteContent('')
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !taskDueDate || !prospect?.id) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          dueDate: taskDueDate,
          priority: taskPriority,
          assignedToId: taskAssignedTo || undefined
        })
      })
      
      if (response.ok) {
        setTaskTitle('')
        setTaskDescription('')
        setTaskDueDate('')
        setTaskPriority('MEDIUM')
        setTaskAssignedTo('')
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Notiz wirklich löschen?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect?.id}/notes/${noteId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect?.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })
      
      if (response.ok) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !prospect) return null

  const getPriceLevelText = (level?: number) => {
    if (!level) return 'Keine Angabe'
    return '€'.repeat(level)
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Hoch'
      case 'MEDIUM': return 'Mittel'
      case 'LOW': return 'Niedrig'
      default: return priority
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prospect.name)}&query_place_id=${prospect.placeId}`,
      '_blank'
    )
  }

  const isImported = !!prospect.id

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{prospect.name}</h2>
              {isImported && prospect.status && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    prospect.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                    prospect.status === 'QUALIFIED' ? 'bg-green-100 text-green-800' :
                    prospect.status === 'PROPOSAL' ? 'bg-purple-100 text-purple-800' :
                    prospect.status === 'NEGOTIATION' ? 'bg-orange-100 text-orange-800' :
                    prospect.status === 'CLOSED_WON' ? 'bg-green-600 text-white' :
                    prospect.status === 'CLOSED_LOST' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {prospect.status === 'NEW' ? 'Neu' :
                     prospect.status === 'CONTACTED' ? 'Kontaktiert' :
                     prospect.status === 'QUALIFIED' ? 'Qualifiziert' :
                     prospect.status === 'PROPOSAL' ? 'Angebot' :
                     prospect.status === 'NEGOTIATION' ? 'Verhandlung' :
                     prospect.status === 'CLOSED_WON' ? 'Gewonnen' :
                     prospect.status === 'CLOSED_LOST' ? 'Verloren' : prospect.status}
                  </span>
                  {prospect.priority && (
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getPriorityColor(prospect.priority)}`}>
                      {getPriorityLabel(prospect.priority)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs - only show if imported */}
          {isImported && (
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'info'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Star className="h-4 w-4 inline mr-2" />
                  Informationen
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'notes'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <StickyNote className="h-4 w-4 inline mr-2" />
                  Notizen ({prospect.notes?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'tasks'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <CheckSquare className="h-4 w-4 inline mr-2" />
                  Aufgaben ({prospect.tasks?.filter(t => !t.completed).length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'activity'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-2" />
                  Aktivitäten ({prospect.interactions?.length || 0})
                </button>
              </nav>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info Tab */}
            {(!isImported || activeTab === 'info') && (
              <>
                {/* Photo Gallery */}
                {prospect.photoUrls && prospect.photoUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      📸 Galerie ({prospect.photoUrls.length} {prospect.photoUrls.length === 1 ? 'Foto' : 'Fotos'})
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {prospect.photoUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${prospect.name} - Foto ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">ℹ️ Informationen</h3>
                  <div className="space-y-3">
                    {/* Rating */}
                    {prospect.rating && (
                      <div className="flex items-center text-sm">
                        <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                        <span className="font-medium">{prospect.rating.toFixed(1)} Sterne</span>
                        <span className="text-gray-600 ml-1">({prospect.reviewCount} Bewertungen)</span>
                      </div>
                    )}

                    {/* Address */}
                    <div className="flex items-start text-sm">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="font-medium">
                        {prospect.address}
                      </div>
                    </div>

                    {/* Phone */}
                    {prospect.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-5 w-5 text-gray-400 mr-2" />
                        <a href={`tel:${prospect.phone}`} className="text-primary-600 hover:underline">
                          {prospect.phone}
                        </a>
                      </div>
                    )}

                    {/* Website */}
                    {prospect.website && (
                      <div className="flex items-center text-sm">
                        <Globe className="h-5 w-5 text-gray-400 mr-2" />
                        <a 
                          href={prospect.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline truncate"
                        >
                          {prospect.website}
                        </a>
                      </div>
                    )}

                    {/* Opening Hours */}
                    {prospect.openingHours && prospect.openingHours.length > 0 && (
                      <div className="flex items-start text-sm">
                        <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          {prospect.openingHours.map((hours, index) => (
                            <div key={index} className="text-gray-600">{hours}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Level */}
                    <div className="flex items-center text-sm">
                      <Euro className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">Preisniveau:</span>
                      <span className="ml-2 text-gray-600">{getPriceLevelText(prospect.priceLevel)}</span>
                    </div>
                  </div>
                </div>

                {/* Lead Score Breakdown */}
                {prospect.leadScoreBreakdown && prospect.leadScoreBreakdown.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Lead-Score Breakdown: {prospect.leadScore}/100
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {prospect.leadScoreBreakdown.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.label}</span>
                            <span className={`px-2 py-1 rounded font-medium ${
                              item.points > 0 
                                ? 'bg-green-100 text-green-800' 
                                : item.points < 0 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.points > 0 ? '+' : ''}{item.points}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between font-semibold">
                        <span>Gesamt-Score:</span>
                        <span className={`px-3 py-1 rounded ${getLeadScoreColor(prospect.leadScore)}`}>
                          {prospect.leadScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Notes Tab */}
            {isImported && activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Neue Notiz</h3>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Notiz eingeben..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || loading}
                    className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Send className="h-4 w-4 inline mr-2" />
                    Notiz hinzufügen
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3">
                  {prospect.notes && prospect.notes.length > 0 ? (
                    prospect.notes.map((note) => (
                      <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              {note.createdBy.firstName} {note.createdBy.lastName} · {formatDateTime(note.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Noch keine Notizen vorhanden
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {isImported && activeTab === 'tasks' && (
              <div className="space-y-4">
                {/* Add Task */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Neue Aufgabe</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Aufgabentitel"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Beschreibung (optional)"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="LOW">Niedrig</option>
                        <option value="MEDIUM">Mittel</option>
                        <option value="HIGH">Hoch</option>
                      </select>
                      <select
                        value={taskAssignedTo}
                        onChange={(e) => setTaskAssignedTo(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Mir selbst zuweisen</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddTask}
                      disabled={!taskTitle.trim() || !taskDueDate || loading}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      Aufgabe erstellen
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {prospect.tasks && prospect.tasks.length > 0 ? (
                    prospect.tasks.map((task) => (
                      <div key={task.id} className={`bg-white border rounded-lg p-4 ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => !task.completed && handleToggleTask(task.id)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-xs">
                                <span className={`px-2 py-1 rounded font-medium ${getPriorityColor(task.priority)}`}>
                                  {getPriorityLabel(task.priority)}
                                </span>
                                <span className="text-gray-500">
                                  Fällig: {formatDate(task.dueDate)}
                                </span>
                                <span className="text-gray-500">
                                  Zugewiesen an: {task.assignedTo.firstName} {task.assignedTo.lastName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Noch keine Aufgaben vorhanden
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {isImported && activeTab === 'activity' && (
              <div className="space-y-3">
                {prospect.interactions && prospect.interactions.length > 0 ? (
                  prospect.interactions.map((interaction) => (
                    <div key={interaction.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          interaction.type === 'CALL' ? 'bg-blue-100 text-blue-600' :
                          interaction.type === 'EMAIL' ? 'bg-purple-100 text-purple-600' :
                          interaction.type === 'MEETING' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {interaction.type === 'CALL' ? 'Anruf' :
                               interaction.type === 'EMAIL' ? 'E-Mail' :
                               interaction.type === 'MEETING' ? 'Meeting' :
                               interaction.type}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(interaction.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{interaction.notes}</p>
                          {interaction.outcome && (
                            <div className="mt-2 text-xs">
                              <span className="font-medium text-gray-700">Ergebnis:</span>
                              <span className="ml-1 text-gray-600">{interaction.outcome}</span>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            {interaction.createdBy.firstName} {interaction.createdBy.lastName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Noch keine Aktivitäten vorhanden
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleGoogleMaps}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              In Google Maps öffnen
            </button>
            
            {onImport && (
              <button
                onClick={() => {
                  onImport()
                  onClose()
                }}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                ✓ Als Prospect importieren
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
