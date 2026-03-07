import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/profile - Get freelancer profile
export async function GET() {
  const { error, freelancer, session } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  return NextResponse.json({
    id: freelancer.id,
    firstName: freelancer.user.firstName,
    lastName: freelancer.user.lastName,
    email: freelancer.user.email,
    phone: freelancer.user.phone,
    street: freelancer.user.street,
    zipCode: freelancer.user.zipCode,
    city: freelancer.user.city,
    companyName: freelancer.companyName,
    taxNumber: freelancer.taxNumber,
    vatId: freelancer.vatId,
    tradeRegNumber: freelancer.tradeRegNumber,
    iban: freelancer.iban,
    bic: freelancer.bic,
    accountHolder: freelancer.accountHolder,
    affiliateCode: freelancer.affiliateCode,
    tier: freelancer.tier,
    region: freelancer.region,
    contractStartDate: freelancer.contractStartDate,
    contractEndDate: freelancer.contractEndDate,
    status: freelancer.status,
    notifyNewBooking: freelancer.notifyNewBooking,
    notifyLeadReminder: freelancer.notifyLeadReminder,
    notifyBillingReady: freelancer.notifyBillingReady,
    notifyWorkshopWarning: freelancer.notifyWorkshopWarning,
  })
}

// PUT /api/freelancer/profile - Update freelancer profile
export async function PUT(request: NextRequest) {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  try {
    const body = await request.json()

    // Update User fields
    const userUpdates: any = {}
    if (body.firstName !== undefined) userUpdates.firstName = body.firstName
    if (body.lastName !== undefined) userUpdates.lastName = body.lastName
    if (body.phone !== undefined) userUpdates.phone = body.phone
    if (body.street !== undefined) userUpdates.street = body.street
    if (body.zipCode !== undefined) userUpdates.zipCode = body.zipCode
    if (body.city !== undefined) userUpdates.city = body.city

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: freelancer.userId },
        data: userUpdates,
      })
    }

    // Update Freelancer fields
    const freelancerUpdates: any = {}
    if (body.companyName !== undefined) freelancerUpdates.companyName = body.companyName
    if (body.taxNumber !== undefined) freelancerUpdates.taxNumber = body.taxNumber
    if (body.vatId !== undefined) freelancerUpdates.vatId = body.vatId
    if (body.tradeRegNumber !== undefined) freelancerUpdates.tradeRegNumber = body.tradeRegNumber
    if (body.iban !== undefined) freelancerUpdates.iban = body.iban
    if (body.bic !== undefined) freelancerUpdates.bic = body.bic
    if (body.accountHolder !== undefined) freelancerUpdates.accountHolder = body.accountHolder
    if (body.notifyNewBooking !== undefined) freelancerUpdates.notifyNewBooking = body.notifyNewBooking
    if (body.notifyLeadReminder !== undefined) freelancerUpdates.notifyLeadReminder = body.notifyLeadReminder
    if (body.notifyBillingReady !== undefined) freelancerUpdates.notifyBillingReady = body.notifyBillingReady
    if (body.notifyWorkshopWarning !== undefined) freelancerUpdates.notifyWorkshopWarning = body.notifyWorkshopWarning

    if (Object.keys(freelancerUpdates).length > 0) {
      await prisma.freelancer.update({
        where: { id: freelancer.id },
        data: freelancerUpdates,
      })
    }

    return NextResponse.json({ success: true, message: 'Profil aktualisiert' })
  } catch (err) {
    console.error('[FREELANCER PROFILE] Error:', err)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}
