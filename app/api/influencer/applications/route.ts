import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/influencer/applications
 * Submit influencer application and notify configured admins
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, platform, channelName, channelUrl, followers, message } = body

    // Validate required fields
    if (!name || !email || !platform || !channelName || !channelUrl) {
      return NextResponse.json(
        { error: 'Alle Pflichtfelder müssen ausgefüllt werden' },
        { status: 400 }
      )
    }

    // Check if application already exists
    const existingApplication = await prisma.influencerApplication.findFirst({
      where: {
        email: email.toLowerCase()
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Mit dieser E-Mail-Adresse wurde bereits eine Bewerbung eingereicht' },
        { status: 400 }
      )
    }

    // Save application to database
    const application = await prisma.influencerApplication.create({
      data: {
        name,
        email: email.toLowerCase(),
        platform,
        channelName,
        channelUrl,
        followers: followers ? parseInt(followers) : null,
        message,
        status: 'PENDING'
      }
    })

    console.log(`[INFLUENCER] New application created: ${application.id}`)

    // Get all admins who want to be notified about influencer applications
    const notificationRecipients = await prisma.adminNotificationSetting.findMany({
      where: {
        notifyInfluencerApplication: true
      },
      select: {
        email: true,
        name: true
      }
    })

    // If there are recipients, send emails
    if (notificationRecipients.length > 0) {
      const applicationDate = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const emailBody = `
        <h2>Neue Influencer-Bewerbung</h2>
        <p>Es ist eine neue Bewerbung für das Partner-Programm eingegangen.</p>
        
        <h3>Bewerber-Informationen:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">E-Mail:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Plattform:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${platform}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Kanal Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${channelName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Kanal URL:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="${channelUrl}">${channelUrl}</a></td>
          </tr>
          ${followers ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Follower:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${followers}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Bewerbungsdatum:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${applicationDate}</td>
          </tr>
        </table>
        
        ${message ? `
        <h3>Nachricht:</h3>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
        ` : ''}
        
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL}/admin/influencer-applications" 
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Bewerbung prüfen
          </a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Diese E-Mail wurde automatisch von Bereifung24 gesendet.
        </p>
      `

      // Send email to all configured recipients
      for (const recipient of notificationRecipients) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: `Neue Influencer-Bewerbung von ${name}`,
            html: emailBody
          })
          console.log(`[INFLUENCER] Application notification sent to ${recipient.email}`)
        } catch (emailError) {
          console.error(`[INFLUENCER] Failed to send notification to ${recipient.email}:`, emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bewerbung erfolgreich eingereicht'
    })

  } catch (error) {
    console.error('[INFLUENCER] Application submission error:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
