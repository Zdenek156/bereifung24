'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Phase {
  id: string
  name: string
  order: number
  startMonth: string
  endMonth: string
}

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  phaseId: string
  phase?: {
    id: string
    name: string
  }
  month?: string
  dueDate?: string | null
  category?: string | null
}

interface TaskEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  task?: Task | null // null = create mode, Task = edit mode
  mode: 'create' | 'edit'
}

export default function TaskEditModal({ isOpen, onClose, onSuccess, task, mode }: TaskEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [phases, setPhases] = useState<Phase[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'P1',
    phaseId: '',
    month: '',
    dueDate: '',
    category: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchPhases()
      if (mode === 'edit' && task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          phaseId: task.phaseId,
          month: task.month || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          category: task.category || ''
        })
      } else {
        // Reset form for create mode
        setFormData({
          title: '',
          description: '',
          priority: 'P1',
          phaseId: '',
          month: '',
          dueDate: '',
          category: ''
        })
      }
    }
  }, [isOpen, mode, task])

  const fetchPhases = async () => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/phases')
      if (response.ok) {
        const result = await response.json()
        setPhases(result.data || [])
        if (result.data && result.data.length > 0 && !formData.phaseId) {
          setFormData(prev => ({ ...prev, phaseId: result.data[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching phases:', error)
    }
  }

  // Automatische Berechnung von Phase und Monat basierend auf Fälligkeitsdatum
  const handleDueDateChange = (newDueDate: string) => {
    if (!newDueDate) {
      setFormData({ ...formData, dueDate: '', month: '', phaseId: formData.phaseId })
      return
    }

    // Extrahiere Monat im Format YYYY-MM
    const month = newDueDate.substring(0, 7)

    // Finde passende Phase basierend auf dem Monat
    let matchingPhase = phases.find(phase => {
      if (!phase.startMonth || !phase.endMonth) return false
      return month >= phase.startMonth && month <= phase.endMonth
    })

    // Falls keine Phase gefunden, nutze die erste Phase
    if (!matchingPhase && phases.length > 0) {
      matchingPhase = phases[0]
    }

    setFormData({
      ...formData,
      dueDate: newDueDate,
      month: month,
      phaseId: matchingPhase ? matchingPhase.id : formData.phaseId
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Bitte Titel eingeben')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'create' 
        ? '/api/mitarbeiter/roadmap/tasks'
        : `/api/mitarbeiter/roadmap/tasks/${task?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PATCH'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Fehler beim Speichern der Aufgabe')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Neue Aufgabe erstellen' : 'Aufgabe bearbeiten'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Priorität
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="P0">P0 - Kritisch</option>
                <option value="P1">P1 - Hoch</option>
                <option value="P2">P2 - Mittel</option>
                <option value="P3">P3 - Niedrig</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fälligkeitsdatum <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Automatisch berechnete Felder (readonly) */}
          {formData.dueDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-2">
                ℹ️ Automatisch berechnet:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Monat:</span>
                  <span className="ml-2 font-medium">{formData.month}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phase:</span>
                  <span className="ml-2 font-medium">
                    {phases.find(p => p.id === formData.phaseId)?.name || 'Keine Phase'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Kategorie
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="z.B. Development, Design, Testing"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Speichert...' : mode === 'create' ? 'Erstellen' : 'Speichern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
