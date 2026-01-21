'use client'

import React from 'react'
import { Clock, Users, Edit2, HandHeart, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RoadmapPhase {
  id: string
  name: string
  color: string
  order: number
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface HelpOffer {
  id: string
  offeredBy: User
  message?: string | null
  createdAt: string
}

interface RoadmapTask {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  assignedTo?: User | null
  phase?: RoadmapPhase | null
  blockedReason?: string | null
  helpOffers?: HelpOffer[]
}

interface PhaseGroup {
  phase: RoadmapPhase
  tasks: RoadmapTask[]
}

interface TimelineViewProps {
  phaseGroups: PhaseGroup[]
  canEdit: boolean
  onEditTask: (task: RoadmapTask) => void
  onOfferHelp: (taskId: string) => void
}

const statusConfig: Record<string, { icon: any; color: string }> = {
  NOT_STARTED: { icon: Circle, color: 'text-gray-400' },
  TODO: { icon: Circle, color: 'text-gray-400' },
  IN_PROGRESS: { icon: Circle, color: 'text-blue-500' },
  BLOCKED: { icon: Circle, color: 'text-red-500' },
  REVIEW: { icon: Circle, color: 'text-yellow-500' },
  COMPLETED: { icon: Circle, color: 'text-green-500' }
}

const priorityConfig: Record<string, { icon: string; label: string; color: string }> = {
  LOW: { icon: '⬇️', label: 'Niedrig', color: 'bg-gray-100 border-gray-300' },
  MEDIUM: { icon: '➡️', label: 'Mittel', color: 'bg-blue-50 border-blue-300' },
  NORMAL: { icon: '➡️', label: 'Normal', color: 'bg-blue-50 border-blue-300' },
  HIGH: { icon: '⬆️', label: 'Hoch', color: 'bg-orange-50 border-orange-300' },
  URGENT: { icon: '🔥', label: 'Dringend', color: 'bg-red-50 border-red-300' },
  CRITICAL: { icon: '🔥', label: 'Kritisch', color: 'bg-red-50 border-red-300' }
}

export default function TimelineView({ phaseGroups, canEdit, onEditTask, onOfferHelp }: TimelineViewProps) {
  // DEBUG: Log data structure
  React.useEffect(() => {
    console.log('TimelineView rendered with:', { 
      phaseGroupsLength: phaseGroups?.length,
      phaseGroups: phaseGroups,
      canEdit 
    })
  }, [phaseGroups, canEdit])

  // Safety check - ensure phaseGroups is valid
  if (!phaseGroups || !Array.isArray(phaseGroups)) {
    console.error('TimelineView: Invalid phaseGroups', phaseGroups)
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Fehler beim Laden</h3>
        <p className="text-gray-600">Die Phasen-Daten konnten nicht geladen werden.</p>
      </Card>
    )
  }

  if (phaseGroups.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-semibold mb-2">Keine Phasen gefunden</h3>
        <p className="text-gray-600">Es sind noch keine Tasks in Phasen vorhanden</p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {phaseGroups.map(group => {
        // Defensive checks for each group
        if (!group) {
          console.error('TimelineView: Invalid group (null/undefined)', group)
          return null
        }
        
        if (!group.phase) {
          console.error('TimelineView: Group missing phase', group)
          return null
        }
        
        if (!group.phase.id || !group.phase.name || !group.phase.color) {
          console.error('TimelineView: Invalid phase data', group.phase)
          return null
        }
        
        if (!group.tasks || !Array.isArray(group.tasks)) {
          console.error('TimelineView: Invalid tasks array', group.tasks)
          return null
        }

        // Filter out any invalid tasks
        const validTasks = group.tasks.filter(task => {
          if (!task) {
            console.warn('TimelineView: Null task in group', group.phase.name)
            return false
          }
          if (!task.id) {
            console.warn('TimelineView: Task missing id', task)
            return false
          }
          if (!task.status || !statusConfig[task.status]) {
            console.warn('TimelineView: Invalid task status', task)
            return false
          }
          if (!task.priority || !priorityConfig[task.priority]) {
            console.warn('TimelineView: Invalid task priority', task)
            return false
          }
          return true
        })

        if (validTasks.length === 0) {
          return null
        }
        
        const StatusIcon = statusConfig['TODO']?.icon || Circle
        
        return (
          <div key={group.phase.id}>
            <div 
              className="flex items-center gap-3 mb-4 pb-2 border-b-2"
              style={{ borderColor: group.phase.color }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: group.phase.color }}
              />
              <h2 className="text-xl font-bold">{group.phase.name}</h2>
              <span className="text-gray-500">({validTasks.length} Tasks)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validTasks.map(task => {
                const taskStatusIcon = statusConfig[task.status]?.icon || Circle
                const TaskIcon = taskStatusIcon
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
                const helpCount = task.helpOffers ? task.helpOffers.length : 0

                return (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${priorityConfig[task.priority]?.color || 'bg-gray-100'}`}>
                        {priorityConfig[task.priority]?.icon || ''} {priorityConfig[task.priority]?.label || task.priority}
                      </span>
                      <TaskIcon className={`h-4 w-4 ${statusConfig[task.status]?.color || 'text-gray-400'}`} />
                    </div>
                    
                    <h3 className={`font-medium mb-1 ${isOverdue ? 'text-red-600' : ''}`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}

                    {task.assignedTo && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Users className="h-3 w-3" />
                        <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-xs mb-2 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(task.dueDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    )}

                    {task.blockedReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-2">
                        <strong>Blockiert:</strong> {task.blockedReason}
                      </div>
                    )}

                    {helpCount > 0 && (
                      <div className="mt-2 text-xs text-green-600 mb-2">
                        💚 {helpCount} Hilfsangebot(e) verfügbar
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditTask(task)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Bearbeiten
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-50 border-green-300"
                        onClick={() => onOfferHelp(task.id)}
                      >
                        <HandHeart className="h-3 w-3 mr-1" />
                        Hilfe anbieten
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      }).filter(element => element !== null)}
    </div>
  )
}
