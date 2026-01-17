'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

interface ServerInfo {
  system: {
    platform: string
    hostname: string
    uptime: number
    loadAverage: number[]
  }
  cpu: {
    model: string
    cores: number
    usage: number
  }
  memory: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  disk: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  database: {
    size: number
    tableCount: number
    connections: number
    topTables: Array<{
      tableName: string
      rowCount: number
      sizeInMB: number
    }>
  }
  application: {
    nodeVersion: string
    pm2Status: string
    pm2Uptime: number
    pm2Memory: number
    pm2Cpu: number
    pm2Restarts: number
    nextVersion: string
  }
  metrics: {
    totalUsers: number
    totalWorkshops: number
    totalCustomers: number
    totalBookings: number
    totalRequests: number
    bookingsLast24h: number
    requestsLast24h: number
  }
}

export default function ServerInfoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      router.push('/login')
      return
    }

    fetchServerInfo()
  }, [session, status, router])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchServerInfo()
    }, 10000) // Refresh alle 10 Sekunden

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchServerInfo = async () => {
    try {
      const response = await fetch('/api/admin/server-info')
      const data = await response.json()

      if (response.ok) {
        setServerInfo(data)
      } else {
        console.error('Fehler beim Laden der Server-Informationen')
      }
    } catch (error) {
      console.error('Error fetching server info:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getHealthStatus = (percent: number) => {
    if (percent < 60) return { color: 'text-green-600', bg: 'bg-green-100', status: 'Gut' }
    if (percent < 80) return { color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'Warnung' }
    return { color: 'text-red-600', bg: 'bg-red-100', status: 'Kritisch' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Lade Server-Informationen...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!serverInfo) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Fehler beim Laden der Server-Informationen</div>
          </div>
        </div>
      </div>
    )
  }

  const memoryHealth = getHealthStatus(serverInfo.memory.usagePercent)
  const diskHealth = getHealthStatus(serverInfo.disk.usagePercent)
  const cpuHealth = getHealthStatus(serverInfo.cpu.usage)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2">
              <BackButton />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Server-Übersicht</h1>
            <p className="text-gray-600 mt-2">
              Hostname: {serverInfo.system.hostname} | Uptime: {formatUptime(serverInfo.system.uptime)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Auto-Refresh (10s)</span>
            </label>
            <button
              onClick={fetchServerInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aktualisieren
            </button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* CPU */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">CPU</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${cpuHealth.bg} ${cpuHealth.color}`}>
                {cpuHealth.status}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-bold text-gray-900">{serverInfo.cpu.usage.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Auslastung</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cpuHealth.color === 'text-green-600' ? 'bg-green-600' : cpuHealth.color === 'text-yellow-600' ? 'bg-yellow-600' : 'bg-red-600'}`}
                  style={{ width: `${Math.min(serverInfo.cpu.usage, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <div>{serverInfo.cpu.cores} Kerne</div>
                <div className="truncate">{serverInfo.cpu.model}</div>
                <div className="mt-2">Load Avg: {serverInfo.system.loadAverage.map(l => l.toFixed(2)).join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">RAM</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${memoryHealth.bg} ${memoryHealth.color}`}>
                {memoryHealth.status}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-bold text-gray-900">{serverInfo.memory.usagePercent.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Auslastung</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${memoryHealth.color === 'text-green-600' ? 'bg-green-600' : memoryHealth.color === 'text-yellow-600' ? 'bg-yellow-600' : 'bg-red-600'}`}
                  style={{ width: `${serverInfo.memory.usagePercent}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <div>Verwendet: {formatBytes(serverInfo.memory.used)}</div>
                <div>Frei: {formatBytes(serverInfo.memory.free)}</div>
                <div>Gesamt: {formatBytes(serverInfo.memory.total)}</div>
              </div>
            </div>
          </div>

          {/* Disk */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Festplatte</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${diskHealth.bg} ${diskHealth.color}`}>
                {diskHealth.status}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-bold text-gray-900">{serverInfo.disk.usagePercent.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Auslastung</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${diskHealth.color === 'text-green-600' ? 'bg-green-600' : diskHealth.color === 'text-yellow-600' ? 'bg-yellow-600' : 'bg-red-600'}`}
                  style={{ width: `${serverInfo.disk.usagePercent}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <div>Verwendet: {formatBytes(serverInfo.disk.used)}</div>
                <div>Frei: {formatBytes(serverInfo.disk.free)}</div>
                <div>Gesamt: {formatBytes(serverInfo.disk.total)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Application & Database */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Application Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Anwendung (PM2)</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${serverInfo.application.pm2Status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {serverInfo.application.pm2Status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-semibold">{formatUptime(serverInfo.application.pm2Uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory:</span>
                <span className="font-semibold">{formatBytes(serverInfo.application.pm2Memory)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CPU:</span>
                <span className="font-semibold">{serverInfo.application.pm2Cpu.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Restarts:</span>
                <span className={`font-semibold ${serverInfo.application.pm2Restarts > 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {serverInfo.application.pm2Restarts}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Node.js:</span>
                  <span className="font-semibold">{serverInfo.application.nodeVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next.js:</span>
                  <span className="font-semibold">{serverInfo.application.nextVersion}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Datenbank (PostgreSQL)</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Datenbankgröße:</span>
                <span className="font-semibold">{formatBytes(serverInfo.database.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tabellen:</span>
                <span className="font-semibold">{serverInfo.database.tableCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Verbindungen:</span>
                <span className="font-semibold">{serverInfo.database.connections}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">Größte Tabellen:</div>
                <div className="space-y-1">
                  {serverInfo.database.topTables.slice(0, 5).map((table) => (
                    <div key={table.tableName} className="flex justify-between text-sm">
                      <span className="text-gray-600">{table.tableName}:</span>
                      <span className="font-medium">{table.rowCount.toLocaleString()} rows ({table.sizeInMB.toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plattform-Metriken</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{serverInfo.metrics.totalUsers}</div>
              <div className="text-sm text-gray-600">Gesamt Benutzer</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{serverInfo.metrics.totalWorkshops}</div>
              <div className="text-sm text-gray-600">Werkstätten</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{serverInfo.metrics.totalCustomers}</div>
              <div className="text-sm text-gray-600">Kunden</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{serverInfo.metrics.totalBookings}</div>
              <div className="text-sm text-gray-600">Gesamt Buchungen</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{serverInfo.metrics.totalRequests}</div>
              <div className="text-sm text-gray-600">Gesamt Anfragen</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{serverInfo.metrics.bookingsLast24h}</div>
              <div className="text-sm text-gray-600">Buchungen (24h)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{serverInfo.metrics.requestsLast24h}</div>
              <div className="text-sm text-gray-600">Anfragen (24h)</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Empfehlungen für Server-Upgrade</h3>
          <div className="space-y-2 text-sm text-gray-700">
            {serverInfo.memory.usagePercent > 80 && (
              <div className="flex items-start space-x-2">
                <span className="text-red-600">⚠️</span>
                <span><strong>RAM kritisch:</strong> RAM-Auslastung über 80%. Erwägen Sie ein Upgrade auf mehr Arbeitsspeicher.</span>
              </div>
            )}
            {serverInfo.disk.usagePercent > 80 && (
              <div className="flex items-start space-x-2">
                <span className="text-red-600">⚠️</span>
                <span><strong>Festplatte kritisch:</strong> Speicherplatz über 80% belegt. Datenbank-Backups prüfen oder mehr Speicher hinzufügen.</span>
              </div>
            )}
            {serverInfo.cpu.usage > 70 && (
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span><strong>CPU-Last hoch:</strong> CPU-Auslastung über 70%. Bei konstanter Last sollten mehr Kerne in Betracht gezogen werden.</span>
              </div>
            )}
            {serverInfo.application.pm2Restarts > 10 && (
              <div className="flex items-start space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span><strong>Viele Restarts:</strong> Die Anwendung wurde {serverInfo.application.pm2Restarts}x neu gestartet. Prüfen Sie auf Memory Leaks oder Abstürze.</span>
              </div>
            )}
            {serverInfo.database.size > 5 * 1024 * 1024 * 1024 && (
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">ℹ️</span>
                <span><strong>Große Datenbank:</strong> Datenbank über 5GB. Regelmäßige Wartung und Optimierung empfohlen.</span>
              </div>
            )}
            {serverInfo.memory.usagePercent < 60 && serverInfo.disk.usagePercent < 60 && serverInfo.cpu.usage < 50 && (
              <div className="flex items-start space-x-2">
                <span className="text-green-600">✅</span>
                <span><strong>Server läuft optimal:</strong> Alle Metriken im grünen Bereich. Kein Upgrade erforderlich.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
