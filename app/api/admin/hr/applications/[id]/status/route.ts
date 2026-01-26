import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// PATCH - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['NEW', 'REVIEWED', 'INVITED', 'REJECTED', 'HIRED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: params.id },
      include: {
        jobPosting: {
          select: {
            title: true,
            department: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.jobApplication.update({
      where: { id: params.id },
      data: { status }
    })

    // Handle REJECTED status - Send rejection email
    if (status === 'REJECTED') {
      try {
        await sendEmail({
          to: application.email,
          subject: `Ihre Bewerbung bei Bereifung24 - ${application.jobPosting.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #333; margin: 0 0 10px 0;">Bereifung24 GmbH</h2>
                <p style="color: #666; margin: 0;">Ihr zuverlässiger Partner für Reifenservice</p>
              </div>
              
              <p>Sehr geehrte/r ${application.firstName} ${application.lastName},</p>
              
              <p>vielen Dank für Ihr Interesse an unserer ausgeschriebenen Position <strong>${application.jobPosting.title}</strong> in der Abteilung ${application.jobPosting.department}.</p>
              
              <p>Nach sorgfältiger Prüfung Ihrer Bewerbungsunterlagen müssen wir Ihnen leider mitteilen, dass wir uns für einen anderen Kandidaten entschieden haben, dessen Profil besser zu den Anforderungen der Position passt.</p>
              
              <p>Diese Entscheidung war nicht einfach, da wir viele qualifizierte Bewerbungen erhalten haben. Wir möchten Ihnen versichern, dass Ihre Unterlagen mit großer Sorgfalt geprüft wurden.</p>
              
              <p>Wir wünschen Ihnen für Ihren weiteren beruflichen Weg alles Gute und viel Erfolg bei Ihrer Jobsuche.</p>
              
              <p style="margin-top: 30px;">Mit freundlichen Grüßen<br>
              Ihr Bereifung24 HR-Team</p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
                <p><strong>Bereifung24 GmbH</strong><br>
                Bietigheim-Bissingen<br>
                Web: www.bereifung24.de</p>
              </div>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Handle HIRED status - Create employee draft
    if (status === 'HIRED') {
      try {
        // Check if employee already exists
        const existingEmployee = await prisma.b24Employee.findFirst({
          where: {
            email: application.email
          }
        })

        if (!existingEmployee) {
          // Create employee record with minimal data as DRAFT
          const newEmployee = await prisma.b24Employee.create({
            data: {
              firstName: application.firstName,
              lastName: application.lastName,
              email: application.email,
              phone: application.phone || '',
              position: application.jobPosting.title,
              department: application.jobPosting.department,
              status: 'DRAFT', // Employee needs to be completed by HR
              password: '', // Will be set during onboarding
              // HR needs to complete: salary, startDate, contract details, etc.
            }
          })

          console.log(`✅ Employee draft created for ${application.email} - ID: ${newEmployee.id}`)
        } else {
          console.log(`ℹ️ Employee already exists for ${application.email}`)
        }
      } catch (employeeError) {
        console.error('Failed to create employee record:', employeeError)
        // Don't fail the request if employee creation fails
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    )
  }
}
