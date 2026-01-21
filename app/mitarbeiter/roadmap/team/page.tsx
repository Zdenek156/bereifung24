'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2, Users, Edit2, HandHeart, TrendingUp, Award, ChevronDown, ChevronRight } from 'lucide-react'
import TaskEditModal from '@/components/TaskEditModal'

// Type guards - prevent any invalid data from reaching render
function isValidPhase(phase: any): phase is RoadmapPhase {
  return !!(
    phase &&
    typeof phase === 'object' &&
    typeof phase.id === 'string' &&
    phase.id.length > 0 &&
    typeof phase.name === 'string' &&
    phase.name.length > 0 &&
    typeof phase.color === 'string' &&
    phase.color.length > 0
  )
}

function isValidTask(task: any): task is RoadmapTask {
  return !!(
    task &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    task.id.length > 0 &&
    typeof task.title === 'string' &&
    task.title.length > 0 &&
    typeof task.status === 'string' &&
    ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].includes(task.status) &&
    isValidPhase(task.phase)
  )
}

interface RoadmapPhase {
  id: string
  name: string
  color: string
}

interface RoadmapTask {
  id: string
  title: string
  description: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string | null
  phase: RoadmapPhase
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  helpOffers?: Array<{
    id: string
    offeredBy: {
      id: string
      name: string
      email: string
    }
  }>
}

interface EmployeeStats {
  employeeId: string
  employeeName: string
  employeeEmail: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  blockedTasks: number
  notStartedTasks: number
  completionRate: number
}

interface Permissions {
  canEditTasks: boolean
}

const statusConfig = {
  NOT_STARTED: { label: 'Nicht begonnen', color: 'text-gray-500', icon: Circle, bgColor: 'bg-gray-100' },
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'text-blue-500', icon: Clock, bgColor: 'bg-blue-100' },
  BLOCKED: { label: 'Blockiert', color: 'text-red-500', icon: AlertCircle, bgColor: 'bg-red-100' },
  COMPLETED: { label: 'Abgeschlossen', color: 'text-green-500', icon: CheckCircle2, bgColor: 'bg-green-100' }
}

const priorityConfig = {
  LOW: { label: 'Niedrig', color: 'text-gray-600' },
  MEDIUM: { label: 'Mittel', color: 'text-yellow-600' },
  HIGH: { label: 'Hoch', color: 'text-orange-600' },
  URGENT: { label: 'Dringend', color: 'text-red-600' }
}

export default function TeamRoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([])
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([])
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'stats' | 'timeline'>('stats')
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTasks(),
        fetchPermissions()
      ])
    } catch (error) {
      console.error('Error loading team roadmap:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/team-tasks')
      if (!response.ok) {
        console.error('Failed to fetch tasks:', response.status)
        return
      }
      
      const result = await response.json()
      if (!result.success) {
        console.error('API returned error:', result.error)
        return
      }
      
      // Filter out invalid tasks BEFORE setting state
      const rawTasks = Array.isArray(result.data) ? result.data : []
      const validTasks = rawTasks.filter(isValidTask)
      
      setTasks(validTasks)
      calculateEmployeeStats(validTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/my-permissions')
      if (!response.ok) {
        console.error('Failed to fetch permissions:', response.status)
        return
      }
      
      const result = await response.json()
      setPermissions(result.data || null)
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setPermissions(null)
    }
  }

  const calculateEmployeeStats = (taskList: RoadmapTask[]) => {
    const employeeMap = new Map<string, EmployeeStats>()

    for (const task of taskList) {
      if (!task.assignedTo || !task.assignedTo.id) continue

      const employeeId = task.assignedTo.id
      
      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employeeId,
          employeeName: task.assignedTo.name || 'Unbekannt',
          employeeEmail: task.assignedTo.email || '',
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          blockedTasks: 0,
          notStartedTasks: 0,
          completionRate: 0
        })
      }

      const stats = employeeMap.get(employeeId)!
      stats.totalTasks++

      if (task.status === 'COMPLETED') stats.completedTasks++
      else if (task.status === 'IN_PROGRESS') stats.inProgressTasks++
      else if (task.status === 'BLOCKED') stats.blockedTasks++
      else if (task.status === 'NOT_STARTED') stats.notStartedTasks++
    }

    // Calculate completion rates
    for (const stats of employeeMap.values()) {
      stats.completionRate = stats.totalTasks > 0 
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0
    }

    setEmployeeStats(Array.from(employeeMap.values()).sort((a, b) => 
      b.completionRate - a.completionRate
    ))
  }

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  const getTasksForEmployee = (employeeId: string) => {
    return tasks.filter(task => 
      task.assignedTo && task.assignedTo.id === employeeId
    )
  }

  const offerHelp = async (taskId: string) => {
    try {
      const response = await fetch(`/api/mitarbeiter/roadmap/tasks/${taskId}/offer-help`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Hilfsangebot wurde erfolgreich gesendet!')
        await fetchTasks()
      } else {
        alert('Fehler beim Senden des Hilfsangebots')
      }
    } catch (error) {
      console.error('Error offering help:', error)
      alert('Fehler beim Senden des Hilfsangebots')
    }
  }

  const handleTaskSaved = async () => {
    setTaskModalOpen(false)
    setSelectedTask(null)
    await fetchTasks()
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Roadmap</h1>
        <p className="text-gray-600">Übersicht über alle Mitarbeiter-Tasks und Fortschritt</p>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('stats')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'stats'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <TrendingUp className="inline h-4 w-4 mr-2" />
          Mitarbeiter-Statistiken
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'timeline'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Calendar className="inline h-4 w-4 mr-2" />
          Phasen-Timeline
        </button>
      </div>

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div className="space-y-4">
          {employeeStats.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Keine Mitarbeiter-Tasks vorhanden</p>
            </div>
          ) : (
            employeeStats.map(stats => {
              const isExpanded = expandedEmployees.has(stats.employeeId)
              const employeeTasks = getTasksForEmployee(stats.employeeId)

              return (
                <div key={stats.employeeId} className="bg-white rounded-lg shadow-sm border p-4">
                  {/* Employee Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleEmployeeExpansion(stats.employeeId)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{stats.employeeName}</h3>
                        <p className="text-sm text-gray-600">{stats.employeeEmail}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.completionRate}%
                          </div>
                          <div className="text-xs text-gray-500">Abschlussrate</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stats.completedTasks} / {stats.totalTasks}
                          </div>
                          <div className="text-xs text-gray-500">Tasks abgeschlossen</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 mb-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="flex gap-4 text-sm mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{stats.completedTasks} Abgeschlossen</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{stats.inProgressTasks} In Arbeit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>{stats.blockedTasks} Blockiert</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Circle className="h-4 w-4 text-gray-500" />
                      <span>{stats.notStartedTasks} Nicht begonnen</span>
                    </div>
                  </div>

                  {/* Expanded Task List */}
                  {isExpanded && employeeTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {employeeTasks.map(task => {
                        if (!isValidTask(task)) return null

                        const StatusIcon = statusConfig[task.status].icon
                        const isOverdue = task.dueDate && 
                          new Date(task.dueDate) < new Date() && 
                          task.status !== 'COMPLETED'

                        return (
                          <div 
                            key={task.id} 
                            className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
                                  <h4 className="font-medium">{task.title}</h4>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                )}

                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span 
                                    className="px-2 py-1 rounded-full"
                                    style={{ 
                                      backgroundColor: task.phase.color + '20',
                                      color: task.phase.color
                                    }}
                                  >
                                    {task.phase.name}
                                  </span>

                                  <span className={`px-2 py-1 rounded-full bg-gray-200 ${priorityConfig[task.priority].color}`}>
                                    {priorityConfig[task.priority].label}
                                  </span>

                                  {task.dueDate && (
                                    <span className={`px-2 py-1 rounded-full ${
                                      isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      <Calendar className="inline h-3 w-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString('de-DE')}
                                    </span>
                                  )}

                                  {task.helpOffers && task.helpOffers.length > 0 && (
                                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                                      💚 {task.helpOffers.length} Hilfsangebot(e)
                                    </span>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3">
                                  {permissions?.canEditTasks && (
                                    <button
                                      onClick={() => {
                                        setTaskModalMode('edit')
                                        setSelectedTask(task)
                                        setTaskModalOpen(true)
                                      }}
                                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                      Bearbeiten
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => offerHelp(task.id)}
                                    className="px-3 py-1.5 text-sm border border-green-300 rounded-lg hover:bg-green-50 text-green-600 transition-colors flex items-center gap-1"
                                  >
                                    <HandHeart className="h-3 w-3" />
                                    Hilfe anbieten
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {(() => {
            // Group tasks by phase - do this in a safe way
            const phaseMap = new Map<string, { phase: RoadmapPhase, tasks: RoadmapTask[] }>()
            
            for (const task of tasks) {
              if (!isValidTask(task)) continue
              
              const phaseId = task.phase.id
              
              if (!phaseMap.has(phaseId)) {
                phaseMap.set(phaseId, {
                  phase: task.phase,
                  tasks: []
                })
              }
              
              phaseMap.get(phaseId)!.tasks.push(task)
            }
            
            const phaseGroups = Array.from(phaseMap.values())
              .sort((a, b) => a.phase.name.localeCompare(b.phase.name))
            
            if (phaseGroups.length === 0) {
              return (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Keine Tasks in Phasen vorhanden</p>
                </div>
              )
            }
            
            return phaseGroups.map(group => {
              if (!isValidPhase(group.phase)) return null
              
              return (
                <div key={group.phase.id}>
                  {/* Phase Header */}
                  <div 
                    className="flex items-center gap-3 mb-4 pb-2 border-b-2"
                    style={{ borderColor: group.phase.color }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.phase.color }}
                    />
                    <h2 className="text-xl font-bold">{group.phase.name}</h2>
                    <span className="text-gray-500">({group.tasks.length} Tasks)</span>
                  </div>

                  {/* Phase Tasks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.tasks.map(task => {
                      if (!isValidTask(task)) return null

                      const StatusIcon = statusConfig[task.status].icon
                      const isOverdue = task.dueDate && 
                        new Date(task.dueDate) < new Date() && 
                        task.status !== 'COMPLETED'

                      return (
                        <div 
                          key={task.id}
                          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <StatusIcon className={`h-5 w-5 ${statusConfig[task.status].color} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-1">{task.title}</h3>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[task.status].bgColor} ${statusConfig[task.status].color}`}>
                                {statusConfig[task.status].label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs bg-gray-100 ${priorityConfig[task.priority].color}`}>
                                {priorityConfig[task.priority].label}
                              </span>
                            </div>

                            {task.assignedTo && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="h-4 w-4" />
                                <span className="truncate">{task.assignedTo.name}</span>
                              </div>
                            )}

                            {task.dueDate && (
                              <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(task.dueDate).toLocaleDateString('de-DE')}</span>
                              </div>
                            )}

                            {task.helpOffers && task.helpOffers.length > 0 && (
                              <div className="text-green-600">
                                💚 {task.helpOffers.length} Hilfsangebot(e) verfügbar
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            {permissions?.canEditTasks && (
                              <button
                                onClick={() => {
                                  setTaskModalMode('edit')
                                  setSelectedTask(task)
                                  setTaskModalOpen(true)
                                }}
                                className="flex-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                Bearbeiten
                              </button>
                            )}
                            
                            <button
                              onClick={() => offerHelp(task.id)}
                              className="flex-1 px-3 py-1.5 text-sm border border-green-300 rounded-lg hover:bg-green-50 text-green-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <HandHeart className="h-3 w-3" />
                              Hilfe anbieten
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}

      {/* Task Edit Modal */}
      {taskModalOpen && (
        <TaskEditModal
          isOpen={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false)
            setSelectedTask(null)
          }}
          onTaskSaved={handleTaskSaved}
          task={selectedTask}
          mode={taskModalMode}
        />
      )}
    </div>
  )
}
