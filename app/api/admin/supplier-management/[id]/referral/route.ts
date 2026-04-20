import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/admin/supplier-management/[id]/referral - Update referral program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      isActive, referralCode, registrationLink,
      bonusPerNewCustomer, bonusForReferred, conditions,
      validFrom, validUntil,
    } = body

    const program = await prisma.supplierReferralProgram.upsert({
      where: { supplierId: params.id },
      create: {
        supplierId: params.id,
        isActive: isActive || false,
        referralCode: referralCode || null,
        registrationLink: registrationLink || null,
        bonusPerNewCustomer: bonusPerNewCustomer ? parseFloat(bonusPerNewCustomer) : null,
        bonusForReferred: bonusForReferred ? parseFloat(bonusForReferred) : null,
        conditions: conditions || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      update: {
        ...(isActive !== undefined && { isActive }),
        ...(referralCode !== undefined && { referralCode: referralCode || null }),
        ...(registrationLink !== undefined && { registrationLink: registrationLink || null }),
        ...(bonusPerNewCustomer !== undefined && { bonusPerNewCustomer: bonusPerNewCustomer ? parseFloat(bonusPerNewCustomer) : null }),
        ...(bonusForReferred !== undefined && { bonusForReferred: bonusForReferred ? parseFloat(bonusForReferred) : null }),
        ...(conditions !== undefined && { conditions: conditions || null }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
      },
    })

    console.log(`✅ [Supplier Management] Referral program updated for supplier ${params.id}`)
    return NextResponse.json(program)
  } catch (error) {
    console.error('❌ [Supplier Management] Error updating referral program:', error)
    return NextResponse.json({ error: 'Failed to update referral program' }, { status: 500 })
  }
}
