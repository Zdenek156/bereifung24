import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST - Reject an influencer application
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { applicationId, rejectionReason } = body

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

    // Update application status
    await prisma.influencerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        rejectionReason: rejectionReason || 'Keine Begründung angegeben'
      }
    })

    // Send rejection email
    await sendEmail({
      to: application.email,
      subject: 'Bereifung24 Influencer-Bewerbung - Leider nicht genehmigt',
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
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; border-radius: 5px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Danke für deine Bewerbung!</h1>
              <p>Bereifung24 Influencer-Programm</p>
            </div>
            
            <div class="content">
              <p>Liebe/r ${application.name},</p>

              <p>vielen Dank für deine Bewerbung zum Bereifung24 Influencer-Partnerprogramm für <strong>${application.platform}</strong>.</p>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #f59e0b;">📋 Bewerbungsstatus: Nicht Angenommen</h3>
                <p>Wir haben deine Bewerbung sorgfältig geprüft und können sie leider nicht annehmen.</p>
                
                ${rejectionReason ? `
                <h4>Begründung:</h4>
                <p>${rejectionReason.replace(/\n/g, '<br>')}</p>
                ` : ''}
              </div>

              <p>Du kannst dich gerne in Zukunft erneut bewerben oder bei Fragen Kontakt mit uns aufnehmen.</p>

              <p>Viele Grüße,<br>Dein Bereifung24 Team</p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 12px; color: #999;">
                Bereifung24 GmbH | kontakt@bereifung24.de<br>
                © 2025 Bereifung24. Alle Rechte vorbehalten.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully'
    })
  } catch (error) {
    console.error('Influencer rejection error:', error)
    return NextResponse.json(
      { error: 'Failed to reject application' },
      { status: 500 }
    )
  }
}
