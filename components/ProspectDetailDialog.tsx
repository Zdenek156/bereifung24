'use client'

import { X, Star, MapPin, Phone, Globe, Clock, Euro, ExternalLink, TrendingUp, Info, FileText, CheckSquare, Activity, Trash2, Send, Plus, Mail, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import ProspectOutreachTab from './ProspectOutreachTab'

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
  email?: string
  openingHours?: string[]
  priceLevel?: number
  leadScore: number
  leadScoreBreakdown?: {
    label: string
    points: number
  }[]
  status?: string
  convertedToWorkshopId?: string | null
  convertedAt?: string | null
}

interface Note {
  id: string
  content: string
  createdAt: string
  createdBy?: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  createdBy?: string
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  position?: string
}

interface Activity {
  id: string
  type: 'NOTE' | 'TASK' | 'EMAIL' | 'CALL' | 'MEETING'
  title: string
  description?: string
  status?: string
  priority?: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  createdAt: string
  icon: string
}

interface ProspectDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  prospect: ProspectDetail | null
  onImport?: () => void
}

export default function ProspectDetailDialog({ 
  isOpen, 
  onClose, 
  prospect,
  onImport 
}: ProspectDetailDialogProps) {
  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'tasks' | 'activity' | 'outreach'>('info')
  
  // Notes State
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  
  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [savingTask, setSavingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  // Activities State
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  
  // Edit State
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [converting, setConverting] = useState(false)

  // Workshop Analytics (for converted / self-registered prospects)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [registeredCheck, setRegisteredCheck] = useState<{ checked: boolean; registered: boolean }>({ checked: false, registered: false })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Load notes when Notes tab is opened
  useEffect(() => {
    if (activeTab === 'notes' && prospect?.placeId) {
      setLoadingNotes(true)
      fetch(`/api/sales/prospects/${prospect.placeId}/notes`)
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Failed to fetch notes')
        })
        .then(data => {
          setNotes(data.notes || [])
        })
        .catch(error => {
          console.error('Error loading notes:', error)
        })
        .finally(() => {
          setLoadingNotes(false)
        })
    }
  }, [activeTab, prospect?.placeId])

  // Load tasks when Tasks tab is opened
  useEffect(() => {
    if (activeTab === 'tasks' && prospect?.placeId) {
      setLoadingTasks(true)
      fetch(`/api/sales/prospects/${prospect.placeId}/tasks`)
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(data => setTasks(data.tasks || []))
        .catch(error => console.error('Error loading tasks:', error))
        .finally(() => setLoadingTasks(false))
    }
  }, [activeTab, prospect?.placeId])

  // Load activities when Activity tab is opened
  useEffect(() => {
    if (activeTab === 'activity' && prospect?.placeId) {
      setLoadingActivities(true)
      fetch(`/api/sales/prospects/${prospect.placeId}/activities`)
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(data => setActivities(data.activities || []))
        .catch(error => console.error('Error loading activities:', error))
        .finally(() => setLoadingActivities(false))
    }
  }, [activeTab, prospect?.placeId])

  // Load employees list once
  useEffect(() => {
    fetch('/api/employee/list')
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        setEmployees(data.employees || [])
      })
      .catch(error => console.error('Error loading employees:', error))
  }, [])

  const loadNotes = useCallback(async () => {
    if (!prospect?.placeId) return
    
    setLoadingNotes(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }, [prospect?.placeId])

  const loadTasks = useCallback(async () => {
    if (!prospect?.placeId) return
    
    setLoadingTasks(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }, [prospect?.placeId])

  // Initialize email value when prospect changes
  useEffect(() => {
    if (prospect) {
      setEmailValue(prospect.email || '')
    }
  }, [prospect])

  // Detect registered/self-registered workshop (for analytics button visibility).
  // Uses convertedToWorkshopId if present, otherwise probes the analytics API
  // (which also matches by email -> covers self-registered workshops).
  useEffect(() => {
    if (!isOpen || !prospect?.placeId) {
      setRegisteredCheck({ checked: false, registered: false })
      setAnalytics(null)
      setAnalyticsOpen(false)
      return
    }
    if (prospect.convertedToWorkshopId) {
      setRegisteredCheck({ checked: true, registered: true })
      return
    }
    let cancelled = false
    fetch(`/api/sales/prospects/${prospect.placeId}/workshop-analytics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return
        setRegisteredCheck({ checked: true, registered: !!data?.registered })
      })
      .catch(() => {
        if (!cancelled) setRegisteredCheck({ checked: true, registered: false })
      })
    return () => { cancelled = true }
  }, [isOpen, prospect?.placeId, prospect?.convertedToWorkshopId])

  const openAnalytics = useCallback(async () => {
    if (!prospect?.placeId) return
    setAnalyticsOpen(true)
    if (analytics) return
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const res = await fetch(`/api/sales/prospects/${prospect.placeId}/workshop-analytics`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAnalytics(data)
    } catch (e: any) {
      setAnalyticsError(e?.message || 'Fehler beim Laden')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [prospect?.placeId, analytics])

  // NOW the conditional return AFTER all hooks
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

  const handleGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prospect.name)}&query_place_id=${prospect.placeId}`,
      '_blank'
    )
  }

  const handleSaveEmail = async () => {
    if (!prospect) return
    
    setSavingEmail(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue })
      })
      
      if (response.ok) {
        setEditingEmail(false)
        // Email saved successfully, no need to refresh full list
      }
    } catch (error) {
      console.error('Error saving email:', error)
    } finally {
      setSavingEmail(false)
    }
  }

  const handleDelete = async () => {
    if (!prospect || !confirm('Möchten Sie diesen Prospect wirklich löschen? Er wird dann wieder in der Suche sichtbar.')) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onClose()
        if (onImport) onImport() // Refresh list
      }
    } catch (error) {
      console.error('Error deleting prospect:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleConvert = async () => {
    if (!prospect) return
    
    if (!emailValue) {
      alert('Bitte geben Sie eine Email-Adresse ein, bevor Sie den Prospect konvertieren.')
      return
    }
    
    if (!confirm('Möchten Sie diesen Prospect in eine aktive Werkstatt konvertieren?')) return
    
    setConverting(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`Prospect erfolgreich konvertiert! Workshop-ID: ${data.workshop.id}`)
        onClose()
        if (onImport) onImport() // Refresh list
      } else {
        alert(`Fehler: ${data.error}`)
      }
    } catch (error) {
      console.error('Error converting prospect:', error)
      alert('Fehler beim Konvertieren')
    } finally {
      setConverting(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !prospect) return
    
    setSavingNote(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newNoteContent,
          prospectData: {
            name: prospect.name,
            address: prospect.address,
            city: prospect.city,
            postalCode: prospect.postalCode,
            lat: prospect.lat,
            lng: prospect.lng,
            phone: prospect.phone,
            website: prospect.website,
            rating: prospect.rating,
            reviewCount: prospect.reviewCount,
            priceLevel: prospect.priceLevel,
            photoUrls: prospect.photoUrls
          }
        })
      })
      
      if (response.ok) {
        setNewNoteContent('')
        await loadNotes()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Notiz wirklich löschen?')) return
    
    try {
      const response = await fetch(`/api/sales/prospects/${prospect!.placeId}/notes/${noteId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadNotes()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !prospect) return
    
    setSavingTask(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTaskTitle,
          description: newTaskDescription || undefined,
          assignedTo: newTaskAssignedTo || undefined,
          dueDate: newTaskDueDate || undefined,
          priority: newTaskPriority,
          prospectData: {
            name: prospect.name,
            address: prospect.address,
            city: prospect.city,
            postalCode: prospect.postalCode,
            lat: prospect.lat,
            lng: prospect.lng,
            phone: prospect.phone,
            website: prospect.website,
            rating: prospect.rating,
            reviewCount: prospect.reviewCount,
            priceLevel: prospect.priceLevel,
            photoUrls: prospect.photoUrls
          }
        })
      })
      
      if (response.ok) {
        setNewTaskTitle('')
        setNewTaskDescription('')
        setNewTaskAssignedTo('')
        setNewTaskDueDate('')
        setNewTaskPriority('MEDIUM')
        await loadTasks()
        
        // Success message
        alert('✓ Aufgabe erfolgreich erstellt!')
        
        // Scroll to top of tasks list after short delay
        setTimeout(() => {
          const tasksContainer = document.querySelector('[data-tasks-container]')
          if (tasksContainer) {
            tasksContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        alert(`Fehler beim Erstellen der Aufgabe: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Fehler beim Erstellen der Aufgabe. Bitte versuche es erneut.')
    } finally {
      setSavingTask(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const response = await fetch(`/api/sales/prospects/${prospect!.placeId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        await loadTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Aufgabe wirklich löschen?')) return
    
    try {
      const response = await fetch(`/api/sales/prospects/${prospect!.placeId}/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Offen'
      case 'IN_PROGRESS': return 'In Bearbeitung'
      case 'COMPLETED': return 'Erledigt'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
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

  const tabs = [
    { id: 'info' as const, label: 'Informationen', icon: Info },
    { id: 'outreach' as const, label: 'Outreach', icon: Mail },
    { id: 'notes' as const, label: 'Notizen', icon: FileText },
    { id: 'tasks' as const, label: 'Aufgaben', icon: CheckSquare },
    { id: 'activity' as const, label: 'Aktivitäten', icon: Activity },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 p-6 border-b border-gray-200">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {prospect.photoUrls && prospect.photoUrls.length > 0 ? (
                <img
                  src={prospect.photoUrls[0]}
                  alt={prospect.name}
                  className="w-20 h-20 object-cover rounded-lg shadow-sm flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(prospect.photoUrls![0], '_blank')}
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-blue-600">
                    {prospect.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{prospect.name}</h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {prospect.city}
                </p>
                {prospect.rating && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                    {prospect.rating.toFixed(1)} ({prospect.reviewCount} Bewertungen)
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleGoogleMaps}
                className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4" />
                Google Maps
              </button>
              {registeredCheck.registered && (
                <button
                  onClick={openAnalytics}
                  className="h-10 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                  title="Erweiterte Analyse basierend auf realen Plattformdaten"
                >
                  <BarChart3 className="h-4 w-4" />
                  Werkstatt-Analyse
                </button>
              )}
              <button
                onClick={handleConvert}
                disabled={converting || registeredCheck.registered}
                className="h-10 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                title={registeredCheck.registered ? 'Werkstatt ist bereits registriert' : 'Prospect in aktive Werkstatt umwandeln'}
              >
                <CheckSquare className="h-4 w-4" />
                {registeredCheck.registered ? 'Bereits registriert' : (converting ? 'Konvertiere...' : 'Konvertieren')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Lösche...' : 'Löschen'}
              </button>
              <button
                onClick={onClose}
                className="h-10 w-10 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">{/* Photo Gallery */}
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
                  <div>
                    <div className="font-medium">{prospect.street || prospect.address}</div>
                    {/* Only show PLZ/Stadt if we have street (not full address) */}
                    {prospect.street && prospect.postalCode && prospect.city && (
                      <div className="text-gray-600 mt-0.5">
                        {prospect.postalCode} {prospect.city}
                      </div>
                    )}
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

                {/* Email */}
                <div className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {editingEmail ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="email@beispiel.de"
                        disabled={savingEmail}
                      />
                      <button
                        onClick={handleSaveEmail}
                        disabled={savingEmail}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {savingEmail ? 'Speichern...' : 'Speichern'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmail(false)
                          setEmailValue(prospect.email || '')
                        }}
                        disabled={savingEmail}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      {emailValue ? (
                        <a href={`mailto:${emailValue}`} className="text-primary-600 hover:underline">
                          {emailValue}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Keine Email hinterlegt</span>
                      )}
                      {prospect.status !== 'CONVERTED' && (
                        <button
                          onClick={() => setEditingEmail(true)}
                          className="text-blue-600 hover:text-blue-700 text-xs underline"
                        >
                          {emailValue ? 'Bearbeiten' : 'Hinzufügen'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

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
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add New Note */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neue Notiz hinzufügen
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Notiz eingeben..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      disabled={savingNote}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNoteContent.trim() || savingNote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-fit"
                    >
                      {savingNote ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Speichern
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {loadingNotes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">Lade Notizen...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Noch keine Notizen vorhanden</p>
                    <p className="text-sm mt-1">Füge oben eine neue Notiz hinzu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(note.createdAt).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {note.createdBy && (
                                <span className="ml-2">• {note.createdBy}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors flex-shrink-0"
                            title="Notiz löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {/* Add New Task */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Neue Aufgabe erstellen</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="z.B. Angebot erstellen"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={savingTask}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beschreibung
                      </label>
                      <textarea
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Weitere Details zur Aufgabe..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        disabled={savingTask}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zuweisen an
                        </label>
                        <select
                          value={newTaskAssignedTo}
                          onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={savingTask}
                        >
                          <option value="">Nicht zugewiesen</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fälligkeitsdatum
                        </label>
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={savingTask}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priorität
                        </label>
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={savingTask}
                        >
                          <option value="LOW">Niedrig</option>
                          <option value="MEDIUM">Mittel</option>
                          <option value="HIGH">Hoch</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim() || savingTask}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {savingTask ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Wird erstellt...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Aufgabe erstellen
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                {loadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">Lade Aufgaben...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Noch keine Aufgaben vorhanden</p>
                    <p className="text-sm mt-1">Erstelle oben eine neue Aufgabe</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-tasks-container>
                    {tasks.map(task => (
                      <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                {getStatusLabel(task.status)}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                ⬆ {getPriorityLabel(task.priority)}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              {task.assignedToName && (
                                <span className="flex items-center gap-1">
                                  👤 {task.assignedToName}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="flex items-center gap-1">
                                  📅 Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                                </span>
                              )}
                              <span>
                                Erstellt: {new Date(task.createdAt).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="PENDING">Offen</option>
                              <option value="IN_PROGRESS">In Bearbeitung</option>
                              <option value="COMPLETED">Erledigt</option>
                            </select>
                            
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                              title="Aufgabe löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'outreach' && (
              <ProspectOutreachTab
                placeId={prospect.placeId}
                prospectName={prospect.name}
                prospectEmail={emailValue || prospect.email}
                prospectWebsite={prospect.website}
                onEmailSaved={onImport}
              />
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Noch keine Aktivitäten vorhanden</p>
                    <p className="text-sm mt-2">Notizen und Aufgaben werden hier angezeigt</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xl">
                              {activity.icon}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {activity.title}
                                </h4>
                                {activity.description && (
                                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                                    {activity.description}
                                  </p>
                                )}
                                {activity.status && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      activity.status === 'COMPLETED' 
                                        ? 'bg-green-100 text-green-800' 
                                        : activity.status === 'IN_PROGRESS'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {activity.status === 'COMPLETED' ? 'Abgeschlossen' : 
                                       activity.status === 'IN_PROGRESS' ? 'In Arbeit' : 'Offen'}
                                    </span>
                                    {activity.priority && (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        activity.priority === 'HIGH' 
                                          ? 'bg-red-100 text-red-800' 
                                          : activity.priority === 'MEDIUM'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {activity.priority === 'HIGH' ? 'Hoch' : 
                                         activity.priority === 'MEDIUM' ? 'Mittel' : 'Niedrig'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Meta Info */}
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">
                                  {activity.createdBy.firstName} {activity.createdBy.lastName}
                                </span>
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(activity.createdAt).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                                {' um '}
                                {new Date(activity.createdAt).toLocaleTimeString('de-DE', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

      {/* Workshop Analytics Modal */}
      {analyticsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setAnalyticsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6" />
                <div>
                  <h3 className="text-lg font-bold">Werkstatt-Analyse</h3>
                  <p className="text-xs text-purple-100">Reale Plattform-Daten</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyticsOpen(false)}
                className="h-9 w-9 inline-flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {analyticsLoading && (
                <div className="text-center py-12 text-gray-500">Lade Analyse…</div>
              )}
              {analyticsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  Fehler: {analyticsError}
                </div>
              )}
              {!analyticsLoading && !analyticsError && analytics && !analytics.registered && (
                <div className="text-center py-8 text-gray-600">
                  Diese Werkstatt ist noch nicht auf der Plattform registriert.
                </div>
              )}
              {!analyticsLoading && !analyticsError && analytics?.registered && (
                <div className="space-y-6">
                  {/* Workshop Header */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900">{analytics.workshop.companyName}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {analytics.workshop.customerNumber} · {analytics.workshop.email}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Registriert vor {analytics.workshop.daysSinceRegistration} Tagen
                          {analytics.matchedBy === 'email' && ' · automatisch erkannt (Email-Match)'}
                          {analytics.matchedBy === 'conversion' && ' · manuell konvertiert'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          analytics.workshop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          analytics.workshop.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {analytics.workshop.status || 'UNKNOWN'}
                        </span>
                        {analytics.workshop.isVerified && (
                          <span className="text-[10px] text-green-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> verifiziert
                          </span>
                        )}
                        {analytics.workshop.stripeEnabled && (
                          <span className="text-[10px] text-blue-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Stripe aktiv
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Comparison */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                      <div className="text-xs text-purple-700 font-medium">Real-Score</div>
                      <div className="text-3xl font-bold text-purple-700 mt-1">{analytics.score.realScore}</div>
                      <div className="text-[10px] text-purple-600">basierend auf KPIs</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-600 font-medium">Lead-Score (alt)</div>
                      <div className="text-3xl font-bold text-gray-700 mt-1">{analytics.score.originalLeadScore}</div>
                      <div className="text-[10px] text-gray-500">vor Registrierung</div>
                    </div>
                    <div className={`border rounded-xl p-4 text-center ${
                      analytics.score.delta >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`text-xs font-medium ${analytics.score.delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>Differenz</div>
                      <div className={`text-3xl font-bold mt-1 ${analytics.score.delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {analytics.score.delta >= 0 ? '+' : ''}{analytics.score.delta}
                      </div>
                      <div className="text-[10px] text-gray-500">Punkte</div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-900">Profil-Vollständigkeit</h5>
                      <span className="text-sm font-bold text-gray-900">{analytics.profile.completionPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full ${
                          analytics.profile.completionPercent >= 80 ? 'bg-green-500' :
                          analytics.profile.completionPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analytics.profile.completionPercent}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        ['Logo', analytics.profile.hasLogo],
                        ['Card-Foto', analytics.profile.hasCardImage],
                        ['Beschreibung', analytics.profile.hasDescription],
                        ['Website', analytics.profile.hasWebsite],
                        ['Öffnungszeiten', analytics.profile.hasOpeningHours],
                        ['Zahlungsarten', analytics.profile.hasPaymentMethods],
                        ['Standort/Geo', analytics.profile.hasLocation],
                        [`${analytics.profile.servicesCount} Services`, analytics.profile.servicesCount > 0],
                        [`${analytics.profile.employeesCount} Mitarbeiter`, analytics.profile.employeesCount > 0],
                      ].map(([label, ok]) => (
                        <div key={label as string} className="flex items-center gap-1.5">
                          {ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={ok ? 'text-gray-700' : 'text-gray-400'}>{label as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Aktivität</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-blue-600">Buchungen</div>
                        <div className="text-xl font-bold text-blue-700">{analytics.activity.totalBookings}</div>
                        <div className="text-[10px] text-blue-500">{analytics.activity.directBookings} direkt</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-green-600">Abgeschlossen</div>
                        <div className="text-xl font-bold text-green-700">{analytics.activity.completedBookings}</div>
                        <div className="text-[10px] text-green-500">{analytics.activity.cancellationRate}% Stornorate</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="text-xs text-yellow-700">Bewertungen</div>
                        <div className="text-xl font-bold text-yellow-700">{analytics.activity.reviewsCount}</div>
                        <div className="text-[10px] text-yellow-600">
                          {analytics.activity.averageRating != null ? `Ø ${analytics.activity.averageRating}★` : 'noch keine'}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-xs text-purple-700">Tage aktiv</div>
                        <div className="text-xl font-bold text-purple-700">{analytics.workshop.daysSinceRegistration}</div>
                        <div className="text-[10px] text-purple-600">seit Registrierung</div>
                      </div>
                    </div>
                  </div>

                  {/* Finance */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Finanzen</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Umsatz</div>
                        <div className="text-lg font-bold text-gray-900">{analytics.finance.totalRevenue.toFixed(2)} €</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Provision</div>
                        <div className="text-lg font-bold text-gray-900">{analytics.finance.platformCommission.toFixed(2)} €</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Auszahlung</div>
                        <div className="text-lg font-bold text-gray-900">{analytics.finance.workshopPayout.toFixed(2)} €</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Ø pro Buchung</div>
                        <div className="text-lg font-bold text-gray-900">{analytics.finance.avgRevenuePerBooking.toFixed(2)} €</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
