import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * GET /api/influencer/profile
 * Get influencer profile
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('influencer_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as any
    const influencerId = decoded.influencerId

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      select: {
        id: true,
        email: true,
        code: true,
        name: true,
        platform: true,
        channelName: true,
        channelUrl: true,
        paymentMethod: true,
        accountHolder: true,
        iban: true,
        bic: true,
        paypalEmail: true,
        taxType: true,
        companyName: true,
        taxId: true,
        street: true,
        zipCode: true,
        city: true,
        country: true,
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ influencer })

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 })
    }
    
    console.error('[INFLUENCER] Get profile error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}

/**
 * PUT /api/influencer/profile
 * Update influencer profile
 */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('influencer_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as any
    const influencerId = decoded.influencerId

    const body = await request.json()
    const {
      name,
      channelName,
      channelUrl,
      platform,
      paymentMethod,
      accountHolder,
      iban,
      bic,
      paypalEmail,
      taxType,
      companyName,
      taxId,
      street,
      zipCode,
      city,
      country,
      currentPassword,
      newPassword
    } = body

    // If password change is requested, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Aktuelles Passwort erforderlich' },
          { status: 400 }
        )
      }

      const influencer = await prisma.influencer.findUnique({
        where: { id: influencerId },
        select: { password: true }
      })

      if (!influencer?.password) {
        return NextResponse.json(
          { error: 'Kein Passwort gesetzt' },
          { status: 400 }
        )
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, influencer.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Aktuelles Passwort falsch' },
          { status: 401 }
        )
      }
    }

    // Update influencer
    const updatedInfluencer = await prisma.influencer.update({
      where: { id: influencerId },
      data: {
        name: name !== undefined ? name : undefined,
        channelName: channelName !== undefined ? channelName : undefined,
        channelUrl: channelUrl !== undefined ? channelUrl : undefined,
        platform: platform !== undefined ? platform : undefined,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
        accountHolder: accountHolder !== undefined ? accountHolder : undefined,
        iban: iban !== undefined ? iban : undefined,
        bic: bic !== undefined ? bic : undefined,
        paypalEmail: paypalEmail !== undefined ? paypalEmail : undefined,
        taxType: taxType !== undefined ? taxType : undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        taxId: taxId !== undefined ? taxId : undefined,
        street: street !== undefined ? street : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined,
        city: city !== undefined ? city : undefined,
        country: country !== undefined ? country : undefined,
        password: newPassword ? await bcrypt.hash(newPassword, 10) : undefined,
      },
      select: {
        id: true,
        email: true,
        code: true,
        name: true,
        platform: true,
        channelName: true,
      }
    })

    return NextResponse.json({
      message: 'Profil erfolgreich aktualisiert',
      influencer: updatedInfluencer
    })

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 })
    }
    
    console.error('[INFLUENCER] Update profile error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}
