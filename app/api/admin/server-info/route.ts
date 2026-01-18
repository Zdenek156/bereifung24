import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // System Info
    const platform = os.platform()
    const hostname = os.hostname()
    const uptime = os.uptime()
    const loadAverage = os.loadavg()

    // CPU Info
    const cpus = os.cpus()
    const cpuModel = cpus[0]?.model || 'Unknown'
    const cpuCores = cpus.length
    
    // CPU Usage berechnen
    let cpuUsage = 0
    if (loadAverage[0] && cpuCores > 0) {
      cpuUsage = (loadAverage[0] / cpuCores) * 100
    }

    // Memory Info
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsagePercent = (usedMemory / totalMemory) * 100

    // Disk Info (versuchen über df command)
    let diskInfo = {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0
    }

    try {
      const { stdout } = await execPromise('df -k /')
      const lines = stdout.split('\n')
      if (lines[1]) {
        const parts = lines[1].split(/\s+/)
        const total = parseInt(parts[1]) * 1024 // Convert KB to bytes
        const used = parseInt(parts[2]) * 1024
        const free = parseInt(parts[3]) * 1024
        const usagePercent = parseFloat(parts[4])
        
        diskInfo = { total, used, free, usagePercent }
      }
    } catch (error) {
      console.error('Error getting disk info:', error)
      // Fallback values
      diskInfo = {
        total: 100 * 1024 * 1024 * 1024, // 100GB fallback
        used: 50 * 1024 * 1024 * 1024,
        free: 50 * 1024 * 1024 * 1024,
        usagePercent: 50
      }
    }

    // Database Info
    let databaseInfo = {
      size: 0,
      tableCount: 0,
      connections: 0,
      topTables: [] as Array<{ tableName: string; rowCount: number; sizeInMB: number }>
    }

    try {
      // Database size
      const dbSizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `
      databaseInfo.size = Number(dbSizeResult[0]?.size || 0)

      // Table count
      const tableCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
      databaseInfo.tableCount = Number(tableCountResult[0]?.count || 0)

      // Active connections
      const connectionResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `
      databaseInfo.connections = Number(connectionResult[0]?.count || 0)

      // Top tables by size
      const topTablesResult = await prisma.$queryRaw<Array<{
        tablename: string
        row_estimate: bigint
        total_bytes: bigint
      }>>`
        SELECT 
          tablename,
          n_live_tup as row_estimate,
          pg_total_relation_size(schemaname||'.'||tablename) as total_bytes
        FROM pg_stat_user_tables
        ORDER BY total_bytes DESC
        LIMIT 10
      `

      databaseInfo.topTables = topTablesResult.map(t => ({
        tableName: t.tablename,
        rowCount: Number(t.row_estimate),
        sizeInMB: Number(t.total_bytes) / (1024 * 1024)
      }))
    } catch (error) {
      console.error('Error getting database info:', error)
    }

    // PM2 Info (wenn verfügbar)
    let pm2Info = {
      status: 'unknown',
      uptime: 0,
      memory: 0,
      cpu: 0,
      restarts: 0
    }

    try {
      const { stdout } = await execPromise('pm2 jlist')
      const processes = JSON.parse(stdout)
      const bereifung24Process = processes.find((p: any) => p.name === 'bereifung24')
      
      if (bereifung24Process) {
        pm2Info = {
          status: bereifung24Process.pm2_env?.status || 'unknown',
          uptime: Math.floor((Date.now() - bereifung24Process.pm2_env?.pm_uptime) / 1000) || 0,
          memory: bereifung24Process.monit?.memory || 0,
          cpu: bereifung24Process.monit?.cpu || 0,
          restarts: bereifung24Process.pm2_env?.restart_time || 0
        }
      }
    } catch (error) {
      console.error('Error getting PM2 info:', error)
    }

    // Application Metrics
    const [
      totalUsers,
      totalWorkshops,
      totalCustomers,
      totalBookings,
      totalRequests,
      bookingsLast24h,
      requestsLast24h
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workshop.count(),
      prisma.customer.count(),
      prisma.booking.count(),
      prisma.tireRequest.count(),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.tireRequest.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Node version
    const nodeVersion = process.version

    // Next.js version (aus package.json)
    let nextVersion = '14.0.4' // Default
    try {
      const packageJson = require('../../../../package.json')
      nextVersion = packageJson.dependencies.next || nextVersion
    } catch {}

    const serverInfo = {
      system: {
        platform,
        hostname,
        uptime,
        loadAverage
      },
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        usage: cpuUsage
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: memoryUsagePercent
      },
      disk: diskInfo,
      database: databaseInfo,
      application: {
        nodeVersion,
        pm2Status: pm2Info.status,
        pm2Uptime: pm2Info.uptime,
        pm2Memory: pm2Info.memory,
        pm2Cpu: pm2Info.cpu,
        pm2Restarts: pm2Info.restarts,
        nextVersion
      },
      metrics: {
        totalUsers,
        totalWorkshops,
        totalCustomers,
        totalBookings,
        totalRequests,
        bookingsLast24h,
        requestsLast24h
      }
    }

    return NextResponse.json(serverInfo)

  } catch (error) {
    console.error('Error in server-info API:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Server-Informationen' },
      { status: 500 }
    )
  }
}
