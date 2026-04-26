import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const BACKUP_DIR = '/var/backups/postgresql'
const LOG_FILE = '/var/log/bereifung24-backup.log'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let dumps: Array<{ name: string; size: number; createdAt: string }> = []
  let dirError: string | null = null
  try {
    const entries = await fs.readdir(BACKUP_DIR)
    const stats = await Promise.all(
      entries
        .filter((f) => /^bereifung24_.*\.sql\.gz$/.test(f))
        .map(async (name) => {
          const stat = await fs.stat(path.join(BACKUP_DIR, name))
          return { name, size: stat.size, createdAt: stat.mtime.toISOString() }
        })
    )
    dumps = stats.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  } catch (err: any) {
    dirError = err?.code === 'EACCES' ? 'permission-denied' : (err?.code || 'unknown')
  }

  let lastLogLine: string | null = null
  try {
    const log = await fs.readFile(LOG_FILE, 'utf8')
    const lines = log.trim().split('\n')
    lastLogLine = lines[lines.length - 1] || null
  } catch {
    // ignore
  }

  const totalBytes = dumps.reduce((sum, d) => sum + d.size, 0)
  const latest = dumps[0] || null

  return NextResponse.json({
    backupDir: BACKUP_DIR,
    dirError,
    count: dumps.length,
    totalBytes,
    latest,
    dumps: dumps.slice(0, 30),
    lastLogLine,
  })
}
