'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import BackButton from '@/components/BackButton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, Target, TrendingUp, AlertCircle } from 'lucide-react'

interface Stats {
  employees: Array<{
    id: string
    name: string
    total: number
    notStarted: number
    inProgress: number
    completed: number
    blocked: number
    progress: number
  }>
  phases: Array<{
    id: string
    name: string
    color: string
    total: number
    completed: number
    progress: number
  }>
  total: {
    total: number
    notStarted: number
    inProgress: number
    completed: number
    blocked: number
    p0: number
    p1: number
    p2: number
    p3: number
  }
}

const STATUS_COLORS = {
  completed: '#10B981',
  inProgress: '#3B82F6',
  notStarted: '#9CA3AF',
  blocked: '#EF4444'
}

export default function RoadmapStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/mitarbeiter/roadmap/stats')
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Statistiken...</div>
        </div>
      </div>
    )
  }

  const pieData = [
    { name: 'Erledigt', value: stats.total.completed, color: STATUS_COLORS.completed },
    { name: 'In Arbeit', value: stats.total.inProgress, color: STATUS_COLORS.inProgress },
    { name: 'Nicht gestartet', value: stats.total.notStarted, color: STATUS_COLORS.notStarted },
    { name: 'Blockiert', value: stats.total.blocked, color: STATUS_COLORS.blocked },
  ]

  const employeeChartData = stats.employees.map(emp => ({
    name: emp.name.split(' ')[0],
    'Erledigt': emp.completed,
    'In Arbeit': emp.inProgress,
    'Nicht gestartet': emp.notStarted,
    'Blockiert': emp.blocked
  }))

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">📊 Roadmap Statistiken 2026</h1>
          <p className="text-gray-600 mt-1">Team-Fortschritt und Auswertungen</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamt Tasks</p>
              <p className="text-3xl font-bold">{stats.total.total}</p>
            </div>
            <Target className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Erledigt</p>
              <p className="text-3xl font-bold text-green-600">{stats.total.completed}</p>
              <p className="text-xs text-gray-500">
                {Math.round((stats.total.completed / stats.total.total) * 100)}%
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Arbeit</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total.inProgress}</p>
              <p className="text-xs text-gray-500">
                {Math.round((stats.total.inProgress / stats.total.total) * 100)}%
              </p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blockiert</p>
              <p className="text-3xl font-bold text-red-600">{stats.total.blocked}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Employee Progress Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Fortschritt pro Mitarbeiter</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Erledigt" stackId="a" fill={STATUS_COLORS.completed} />
              <Bar dataKey="In Arbeit" stackId="a" fill={STATUS_COLORS.inProgress} />
              <Bar dataKey="Nicht gestartet" stackId="a" fill={STATUS_COLORS.notStarted} />
              <Bar dataKey="Blockiert" stackId="a" fill={STATUS_COLORS.blocked} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution Pie */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Status-Verteilung</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Employee Table */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">👥 Mitarbeiter-Übersicht</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Mitarbeiter</th>
                <th className="text-center p-3">Total</th>
                <th className="text-center p-3">Offen</th>
                <th className="text-center p-3">In Arbeit</th>
                <th className="text-center p-3">Erledigt</th>
                <th className="text-center p-3">Blockiert</th>
                <th className="text-left p-3">Fortschritt</th>
              </tr>
            </thead>
            <tbody>
              {stats.employees.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{emp.name}</td>
                  <td className="p-3 text-center">{emp.total}</td>
                  <td className="p-3 text-center text-gray-600">{emp.notStarted}</td>
                  <td className="p-3 text-center text-blue-600">{emp.inProgress}</td>
                  <td className="p-3 text-center text-green-600">{emp.completed}</td>
                  <td className="p-3 text-center text-red-600">{emp.blocked}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${emp.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{emp.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Phase Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">📅 Phasen-Übersicht</h2>
        <div className="space-y-4">
          {stats.phases.filter(phase => phase && phase.color).map(phase => (
            <div key={phase.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: phase?.color || '#gray' }}
                  />
                  <span className="font-medium">{phase?.name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {phase.completed}/{phase.total} Tasks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ 
                      width: `${phase?.progress || 0}%`,
                      backgroundColor: phase?.color || '#gray'
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{phase.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
