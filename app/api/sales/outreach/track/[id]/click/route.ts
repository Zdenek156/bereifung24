import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// SSRF-Schutz: nur http/https, keine privaten IPs/localhost
const BLOCKED = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

function isSafeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (BLOCKED.some((re) => re.test(u.hostname.toLowerCase()))) return null
    return u
  } catch {
    return null
  }
}

// GET ?u=<encoded url>
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const target = req.nextUrl.searchParams.get('u') || ''
  const safe = isSafeUrl(target)
  if (!safe) {
    return NextResponse.redirect('https://bereifung24.de', { status: 302 })
  }

  if (params.id) {
    try {
      await prisma.prospectOutreachEmail.update({
        where: { id: params.id },
        data: {
          clickedAt: new Date(),
          clickCount: { increment: 1 },
        },
      })
    } catch { /* ignore */ }
  }

  return NextResponse.redirect(safe.toString(), { status: 302 })
}
