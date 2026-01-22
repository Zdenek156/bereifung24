'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
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

// Dynamic import with NO SSR
const TimelineView = dynamic(() => import('./TimelineView'), { 
  ssr: false,
  loading: () => (
    <Card className="p-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
      <p className="text-gray-600">Timeline wird geladen...</p>
    </Card>
  )
})

interface RoadmapPhase {
  id: string
  name: string
  color: string
}

interface RoadmapTask {
  id: string
  title: string
  description: string | null
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  phase: RoadmapPhase | null
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
  }> | null
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
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'stats' | 'timeline'>('stats')
  const [mounted, setMounted] = useState(false)
  
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<any>(null)

  // Prevent hydration errors - only render timeline on client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchPermissions()
  }, [])

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
      const response = await fetch('/api/mitarbeiter/roadmap/team-tasks')
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result)
        
        if (result.success && Array.isArray(result.data)) {
          console.log('Tasks loaded:', result.data.length)
          
          // Filter valid tasks
          const validTasks = result.data.filter((task: any) => {
            return task && 
                   typeof task === 'object' && 
                   task.id && 
                   task.title &&
                   task.status
          })
          
          console.log('Valid tasks after filtering:', validTasks.length)
          setTasks(validTasks)
        } else {
          console.error('Invalid API response structure:', result)
          setTasks([])
        }
      }
    } catch (error) {
      console.error('Error fetching team tasks:', error)
      setTasks([])
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

  const getEmployeeStats = () => {
    const employeeMap = new Map()
    
    tasks.forEach(task => {
      if (!task.assignedTo || !task.assignedToId) return
      
      if (!employeeMap.has(task.assignedToId)) {
        employeeMap.set(task.assignedToId, {
          employee: {
            id: task.assignedTo.id,
            name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
            firstName: task.assignedTo.firstName,
            lastName: task.assignedTo.lastName
          },
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          blocked: 0,
          total: 0
        })
      }
      
      const stats = employeeMap.get(task.assignedToId)
      stats.total++
      
      if (task.status === 'NOT_STARTED') stats.notStarted++
      else if (task.status === 'IN_PROGRESS') stats.inProgress++
      else if (task.status === 'COMPLETED') stats.completed++
      else if (task.status === 'BLOCKED') stats.blocked++
    })
    
    return Array.from(employeeMap.values()).map(stat => ({
      ...stat,
      completionRate: stat.total > 0 ? (stat.completed / stat.total) * 100 : 0
    })).sort((a, b) => b.completionRate - a.completionRate)
  }

  const groupTasksByPhase = () => {
    console.log('groupTasksByPhase called with tasks:', tasks.length)
    
    const grouped: Record<string, { phase: RoadmapPhase, tasks: RoadmapTask[] }> = {}
    
    tasks.forEach((task, index) => {
      if (!task) {
        console.warn(`Task at index ${index} is null/undefined`)
        return
      }
      
      if (!task.phase) {
        console.warn(`Task ${task.id || index} has no phase`)
        return
      }
      
      if (!task.phase.id || !task.phase.color || !task.phase.name) {
        console.warn(`Task ${task.id || index} has incomplete phase data:`, task.phase)
        return
      }
      
      if (!grouped[task.phase.id]) {
        grouped[task.phase.id] = {
          phase: task.phase,
          tasks: []
        }
      }
      grouped[task.phase.id].tasks.push(task)
    })
    
    const result = Object.values(grouped).sort((a, b) => 
      a.phase.name.localeCompare(b.phase.name)
    )
    
    console.log('Grouped phases:', result.length, result)
    return result
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

  // Only calculate these when needed
  const employeeStats = viewMode === 'stats' ? getEmployeeStats() : []
  const phaseGroups = (viewMode === 'timeline' && mounted) ? groupTasksByPhase() : []

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

              <div className="relative w-full h-8 bg-gray-100 rounded-lg overflow-hidden mb-4">
                {stat.completed > 0 && (
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                    style={{ width: `${stat.completionRate}%` }}
                  />
                )}
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

              <div className="grid grid-cols-4 gap-4 mb-4">
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

              {/* Task Liste */}
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-3 text-sm text-gray-700">Aufgaben:</h4>
                <div className="space-y-2">
                  {tasks
                    .filter(t => t.assignedToId === stat.employee.id)
                    .map(task => {
                      const StatusIcon = statusConfig[task.status].icon
                      const priorityInfo = priorityConfig[task.priority]
                      
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            setTaskModalMode('edit')
                            setSelectedTask(task)
                            setTaskModalOpen(true)
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusConfig[task.status].color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{task.title}</span>
                                <span className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${priorityInfo.color}`}>
                                  {priorityInfo.icon} {priorityInfo.label}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-gray-600 truncate mt-0.5">{task.description}</p>
                              )}
                            </div>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 ml-3 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          )}
                          {permissions?.canEditTasks && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setTaskModalMode('edit')
                                setSelectedTask(task)
                                setTaskModalOpen(true)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Phase Timeline View - Dynamic Component (NO SSR) */}
      {viewMode === 'timeline' && (
        <TimelineView
          phaseGroups={phaseGroups}
          canEdit={permissions?.canEditTasks || false}
          onEditTask={(task) => {
            setTaskModalMode('edit')
            setSelectedTask(task)
            setTaskModalOpen(true)
          }}
          onOfferHelp={(taskId) => offerHelp(taskId)}
        />
      )}

      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Keine Tasks gefunden</h3>
          <p className="text-gray-600">
            Das Team hat noch keine Tasks
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
