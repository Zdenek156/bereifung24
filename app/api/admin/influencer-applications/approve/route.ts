import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// POST - Approve an influencer application and create influencer account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      applicationId,
      code,
      commissionPer1000Views,
      commissionPerCustomerRegistration,
      commissionPerCustomerFirstOffer,
      commissionPerWorkshopRegistration,
      commissionPerWorkshopFirstOffer,
      isUnlimited
    } = body

    // Get application
    const application = await prisma.influencerApplication.findUnique({
      where: { id: applicationId }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application already reviewed' }, { status: 400 })
    }

    // Check if code is already taken
    const existingCode = await prisma.influencer.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (existingCode) {
      return NextResponse.json({ error: 'Code bereits vergeben' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: application.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email bereits registriert' }, { status: 400 })
    }

    // Generate random password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create user account
    const user = await prisma.user.create({
      data: {
        email: application.email,
        password: hashedPassword,
        role: 'INFLUENCER',
        isVerified: true
      }
    })

    // Create influencer profile
    const influencer = await prisma.influencer.create({
      data: {
        userId: user.id,
        email: application.email,
        code: code.toUpperCase(),
        platform: application.platform,
        channelName: application.channelName,
        channelUrl: application.channelUrl,
        isActive: true,
        isRegistered: false,
        commissionPer1000Views,
        commissionPerCustomerRegistration,
        commissionPerCustomerFirstOffer,
        commissionPerWorkshopRegistration,
        commissionPerWorkshopFirstOffer,
        isUnlimited
      }
    })

    // Update application
    await prisma.influencerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        influencerId: influencer.id
      }
    })

    // Send welcome email
    const trackingLink = `https://bereifung24.de?ref=${code.toUpperCase()}`
    const loginLink = 'https://bereifung24.de/influencer/login'

    await sendEmail({
      to: application.email,
      subject: '🎉 Willkommen im Bereifung24 Partner-Programm!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .commission { background: #e8f5e9; padding: 10px 15px; margin: 8px 0; border-radius: 5px; }
            code { background: #f4f4f4; padding: 2px 8px; border-radius: 3px; font-family: monospace; color: #d63384; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Herzlich Willkommen!</h1>
              <p>Deine Bewerbung wurde genehmigt</p>
            </div>
            
            <div class="content">
              <p>Hallo ${application.name},</p>
              
              <p>Großartige Neuigkeiten! Deine Bewerbung für das Bereifung24 Partner-Programm wurde genehmigt. Wir freuen uns, dich in unserem Team zu haben! 🚀</p>
              
              <div class="info-box">
                <h3>📊 Deine Partner-Daten:</h3>
                <p><strong>Affiliate-Code:</strong> <code>${code.toUpperCase()}</code></p>
                <p><strong>Tracking-Link:</strong><br><code>${trackingLink}</code></p>
                <p><strong>Plattform:</strong> ${application.platform}</p>
                <p><strong>Kanal:</strong> ${application.channelName}</p>
              </div>

              <div class="info-box">
                <h3>💰 Deine individuellen Provisionen:</h3>
                <div class="commission">
                  <strong>Pro 1000 Views (CPM):</strong> €${(commissionPer1000Views / 100).toFixed(2)}
                </div>
                <div class="commission">
                  <strong>Pro registriertem Kunden:</strong> €${(commissionPerCustomerRegistration / 100).toFixed(2)}
                </div>
                <div class="commission">
                  <strong>Pro erstem Angebot vom Kunden:</strong> €${(commissionPerCustomerFirstOffer / 100).toFixed(2)}
                </div>
                <div class="commission">
                  <strong>Pro registrierter Werkstatt:</strong> €${(commissionPerWorkshopRegistration / 100).toFixed(2)}
                </div>
                <div class="commission">
                  <strong>Pro erstem Angebot von Werkstatt:</strong> €${(commissionPerWorkshopFirstOffer / 100).toFixed(2)}
                </div>
              </div>

              <div class="info-box">
                <h3>🔐 Login-Daten:</h3>
                <p><strong>E-Mail:</strong> ${application.email}</p>
                <p><strong>Temporäres Passwort:</strong> <code>${tempPassword}</code></p>
                <p style="color: #d32f2f; font-size: 14px;">⚠️ Bitte ändere dein Passwort nach dem ersten Login!</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" class="button">🚀 Jetzt einloggen</a>
              </div>

              <div class="info-box">
                <h3>📖 So geht's weiter:</h3>
                <ol>
                  <li><strong>Einloggen:</strong> Melde dich mit deinen Zugangsdaten an</li>
                  <li><strong>Profil vervollständigen:</strong> Füge deine Zahlungsdaten hinzu</li>
                  <li><strong>Link teilen:</strong> Nutze deinen persönlichen Tracking-Link</li>
                  <li><strong>Provisionen verdienen:</strong> Für Clicks, Kunden & Werkstätten</li>
                  <li><strong>Auszahlung:</strong> Monatliche Abrechnung ab 50€ Mindestbetrag</li>
                </ol>
              </div>

              <p><strong>Fragen?</strong> Unser Support-Team hilft dir gerne weiter: <a href="mailto:partner@bereifung24.de">partner@bereifung24.de</a></p>

              <p>Viel Erfolg und herzlich willkommen im Team! 🎊</p>

              <p>Beste Grüße,<br>
              Dein Bereifung24 Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      success: true,
      influencer,
      message: 'Influencer erfolgreich freigeschaltet und Welcome-E-Mail versendet'
    })

  } catch (error) {
    console.error('Influencer approval error:', error)
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 })
  }
}
