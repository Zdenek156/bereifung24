import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { sendTemplateEmail } from '@/lib/email'

function requireAdmin(session: any) {
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    return false
  }
  return true
}

// GET /api/admin/freelancers - List all freelancers
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const tier = searchParams.get('tier') || undefined
  const search = searchParams.get('search') || undefined

  const where: any = {}
  if (status) where.status = status
  if (tier) where.tier = tier
  if (search) {
    where.OR = [
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { email: { contains: search } } },
      { affiliateCode: { contains: search } },
      { region: { contains: search } },
    ]
  }

  const freelancers = await prisma.freelancer.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { workshops: true, leads: true, commissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get summary stats
  const totalWorkshops = freelancers.reduce((s, f) => s + f._count.workshops, 0)
  const totalLeads = freelancers.reduce((s, f) => s + f._count.leads, 0)

  return NextResponse.json({
    freelancers: freelancers.map(f => ({
      id: f.id,
      userId: f.userId,
      name: `${f.user.firstName || ''} ${f.user.lastName || ''}`.trim() || f.user.email,
      email: f.user.email,
      phone: f.phone,
      region: f.region,
      tier: f.tier,
      status: f.status,
      affiliateCode: f.affiliateCode,
      workshopCount: f._count.workshops,
      leadCount: f._count.leads,
      commissionCount: f._count.commissions,
      companyName: f.companyName,
      createdAt: f.createdAt,
    })),
    stats: {
      total: freelancers.length,
      active: freelancers.filter(f => f.status === 'ACTIVE').length,
      totalWorkshops,
      totalLeads,
    },
  })
}

// POST /api/admin/freelancers - Create new freelancer (with user)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const body = await request.json()
  const { email, firstName, lastName, phone, region, tier, companyName } = body

  if (!email || !firstName || !lastName) {
    return NextResponse.json({ error: 'E-Mail, Vorname und Nachname sind Pflicht' }, { status: 400 })
  }

  // Check if email is already in use by ANY user
  const existing = await prisma.user.findUnique({ 
    where: { email }, 
    include: { freelancer: true, customer: true, workshop: true } 
  })

  if (existing) {
    if (existing.freelancer) {
      return NextResponse.json({ error: 'Dieser Benutzer ist bereits als Freelancer registriert' }, { status: 400 })
    }
    if (existing.customer) {
      return NextResponse.json({ error: `Diese E-Mail ist bereits als Kunde registriert (${existing.firstName} ${existing.lastName}). Bitte eine andere E-Mail verwenden.` }, { status: 400 })
    }
    if (existing.workshop) {
      return NextResponse.json({ error: `Diese E-Mail ist bereits als Werkstatt registriert. Bitte eine andere E-Mail verwenden.` }, { status: 400 })
    }
    // User exists but with no specific profile — block anyway
    return NextResponse.json({ error: `Diese E-Mail ist bereits vergeben (Rolle: ${existing.role}). Bitte eine andere E-Mail verwenden.` }, { status: 400 })
  }

  // Generate unique affiliate code
  const code = `FL-${firstName.substring(0, 2).toUpperCase()}${lastName.substring(0, 2).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // Generate a password reset token instead of a temp password
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 3600000) // 7 Tage gültig

  // Create user with no usable password — they must set it via the link
  const bcrypt = require('bcryptjs')
  const randomPassword = crypto.randomBytes(32).toString('hex') // not shared, just a placeholder
  const hashedPassword = await bcrypt.hash(randomPassword, 10)

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role: 'FREELANCER',
      resetToken,
      resetTokenExpiry,
    },
  })

  const freelancer = await prisma.freelancer.create({
    data: {
      userId: user.id,
      phone: phone || null,
      region: region || null,
      tier: tier || 'STARTER',
      companyName: companyName || null,
      affiliateCode: code,
      status: 'ACTIVE',
      contractStartDate: new Date(),
    },
  })

  // Send welcome email with password setup link
  const baseUrl = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
  const setupLink = `${baseUrl}/reset-password?token=${resetToken}`

  const fallbackTemplate = {
    subject: `Willkommen bei Bereifung24 – Dein Freelancer-Zugang`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; padding: 15px 30px; background: #06b6d4; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
    .info-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 0; padding: 20px; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; background: #f3f4f6; border: 1px solid #e5e7eb; border-top: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Willkommen im Freelancer-Team!</h1>
      <p>Bereifung24 Vertriebspartner</p>
    </div>
    <div class="content">
      <p><strong>Hallo ${firstName},</strong></p>
      <p>Herzlich willkommen als Vertriebspartner bei Bereifung24! Wir freuen uns auf die Zusammenarbeit.</p>

      <div class="info-box">
        <h3 style="margin-top:0;">Deine Zugangsdaten:</h3>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Affiliate-Code:</strong> ${code}</p>
        <p><strong>Region:</strong> ${region || 'Noch nicht zugewiesen'}</p>
        <p><strong>Tier:</strong> ${tier || 'Starter (15%)'}</p>
      </div>

      <p>Bitte erstelle jetzt dein Passwort, um auf dein Freelancer-Dashboard zuzugreifen:</p>
      <div style="text-align: center;">
        <a href="${setupLink}" class="button">Passwort erstellen & loslegen</a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">Dieser Link ist 7 Tage gültig. Danach kannst du die "Passwort vergessen"-Funktion auf der Login-Seite nutzen.</p>

      <h3>Was dich erwartet:</h3>
      <ul>
        <li><strong>Dashboard:</strong> Übersicht deiner Werkstätten, Provisionen und KPIs</li>
        <li><strong>Lead-Pipeline:</strong> Werkstatt-Leads verwalten und tracken</li>
        <li><strong>Provisionen:</strong> Transparente Abrechnung deiner Verdienste</li>
        <li><strong>Materialien:</strong> Verkaufsunterlagen und Präsentationen</li>
      </ul>

      <p>Bei Fragen erreichst du uns jederzeit unter <a href="mailto:support@bereifung24.de">support@bereifung24.de</a>.</p>
      <p>Viel Erfolg!</p>
      <p><strong>Dein Bereifung24-Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>Bereifung24 GmbH</strong></p>
      <p>Deine Plattform für Reifenservice</p>
    </div>
  </div>
</body>
</html>`
  }

  try {
    await sendTemplateEmail(
      'WELCOME_FREELANCER',
      email,
      { firstName, lastName, email, affiliateCode: code, region: region || 'Noch nicht zugewiesen', tier: tier || 'Starter (15%)', setupLink },
      undefined,
      fallbackTemplate
    )
    console.log(`✅ Welcome email sent to freelancer ${email}`)
  } catch (err) {
    console.error(`⚠️ Failed to send welcome email to ${email}:`, err)
    // Don't fail the creation if email fails
  }

  return NextResponse.json({ freelancer, affiliateCode: code }, { status: 201 })
}
