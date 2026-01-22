'use client'

import React, { useState, useEffect } from 'react'
import { Clock, AlertCircle, CheckCircle2, Circle, Loader2, Users, Edit2, Award, Filter, ArrowUpDown } from 'lucide-react'
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
  
  // Filter states
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterEmployee, setFilterEmployee] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate')
  
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create')
  const [selectedTask, setSelectedTask] = useState<any>(null)

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
    
    // Apply filters
    const filteredTasks = tasks.filter(task => {
      if (filterEmployee !== 'all' && task.assignedToId !== filterEmployee) return false
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false
      if (filterPhase !== 'all' && task.phase?.id !== filterPhase) return false
      if (filterStatus !== 'all' && task.status !== filterStatus) return false
      return true
    })
    
    filteredTasks.forEach(task => {
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
  
  const getFilteredAndSortedTasks = (employeeId: string) => {
    let filtered = tasks.filter(t => t.assignedToId === employeeId)
    
    // Apply filters
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority)
    }
    if (filterPhase !== 'all') {
      filtered = filtered.filter(t => t.phase?.id === filterPhase)
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }
    
    // Apply sorting
    if (sortBy === 'dueDate') {
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    } else if (sortBy === 'priority') {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    }
    
    return filtered
  }
  
  // Get unique employees, phases for dropdowns
  const uniqueEmployees = Array.from(new Set(
    tasks
      .filter(t => t.assignedTo)
      .map(t => JSON.stringify({ id: t.assignedToId, name: `${t.assignedTo!.firstName} ${t.assignedTo!.lastName}` }))
  )).map(s => JSON.parse(s))
  
  const uniquePhases = Array.from(new Set(
    tasks
      .filter(t => t.phase)
      .map(t => JSON.stringify({ id: t.phase!.id, name: t.phase!.name, color: t.phase!.color }))
  )).map(s => JSON.parse(s))

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const employeeStats = getEmployeeStats()

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
      </div>

      {/* Filter und Sortierung */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="font-semibold text-sm">Filter:</span>
          </div>
          
          {/* Mitarbeiter Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                {filterEmployee === 'all' 
                  ? 'Alle Mitarbeiter' 
                  : uniqueEmployees.find(e => e.id === filterEmployee)?.name || 'Mitarbeiter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterEmployee('all')}>
                Alle Mitarbeiter
              </DropdownMenuItem>
              {uniqueEmployees.map(emp => (
                <DropdownMenuItem key={emp.id} onClick={() => setFilterEmployee(emp.id)}>
                  {emp.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priorität Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {filterPriority === 'all' ? '🔘' : priorityConfig[filterPriority as keyof typeof priorityConfig]?.icon}
                <span className="ml-2">
                  {filterPriority === 'all' ? 'Alle Prioritäten' : filterPriority}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterPriority('all')}>
                Alle Prioritäten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('P0')}>
                🔴 P0 - Critical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('P1')}>
                🟡 P1 - High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('P2')}>
                🟢 P2 - Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('P3')}>
                🔵 P3 - Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Phase Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ 
                    backgroundColor: filterPhase === 'all' 
                      ? '#9CA3AF' 
                      : uniquePhases.find(p => p.id === filterPhase)?.color 
                  }}
                />
                {filterPhase === 'all' 
                  ? 'Alle Phasen' 
                  : uniquePhases.find(p => p.id === filterPhase)?.name || 'Phase'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterPhase('all')}>
                Alle Phasen
              </DropdownMenuItem>
              {uniquePhases.map(phase => (
                <DropdownMenuItem key={phase.id} onClick={() => setFilterPhase(phase.id)}>
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: phase.color }}
                  />
                  {phase.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {filterStatus === 'all' 
                  ? <Circle className="h-4 w-4 mr-2" />
                  : React.createElement(statusConfig[filterStatus as keyof typeof statusConfig]?.icon || Circle, { className: 'h-4 w-4 mr-2' })}
                {filterStatus === 'all' 
                  ? 'Alle Status' 
                  : statusConfig[filterStatus as keyof typeof statusConfig]?.label || 'Status'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                Alle Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('NOT_STARTED')}>
                <Circle className="h-4 w-4 mr-2 text-gray-400" />
                Nicht gestartet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('IN_PROGRESS')}>
                <Loader2 className="h-4 w-4 mr-2 text-blue-500" />
                In Arbeit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('COMPLETED')}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                Erledigt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('BLOCKED')}>
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                Blockiert
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {/* Sortierung */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-600" />
            <span className="font-semibold text-sm">Sortiert nach:</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortBy === 'dueDate' ? '📅 Fälligkeitsdatum' : '⚡ Priorität'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('dueDate')}>
                📅 Fälligkeitsdatum
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('priority')}>
                ⚡ Priorität
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filter Button */}
          {(filterEmployee !== 'all' || filterPriority !== 'all' || filterPhase !== 'all' || filterStatus !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFilterEmployee('all')
                setFilterPriority('all')
                setFilterPhase('all')
                setFilterStatus('all')
              }}
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </Card>

      {/* Employee Statistics View */}
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
                  {getFilteredAndSortedTasks(stat.employee.id).map(task => {
                      if (!task.phase || !task.phase.color) {
                        console.warn('Task without valid phase:', task.id, task.title)
                        return null
                      }
                      
                      if (!task.status || !statusConfig[task.status]) {
                        console.warn('Task with invalid status:', task.id, task.status)
                        return null
                      }
                      
                      if (!task.priority || !priorityConfig[task.priority]) {
                        console.warn('Task with invalid priority:', task.id, task.priority)
                        return null
                      }
                      
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
      </div>

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
