import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort erforderlich' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        workshop: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account ist deaktiviert' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      )
    }

    // Track affiliate conversion on first login
    if (user.customer?.id) {
      try {
        const affiliateRef = request.cookies.get('b24_affiliate_ref')?.value
        const cookieId = request.cookies.get('b24_cookie_id')?.value

        if (affiliateRef && cookieId) {
          // Check if conversion already exists
          const existingConversion = await prisma.affiliateConversion.findFirst({
            where: {
              cookieId: cookieId,
              type: 'REGISTRATION',
              customerId: user.customer.id
            }
          })

          if (!existingConversion) {
            // Find the influencer
            const influencer = await prisma.influencer.findUnique({
              where: { code: affiliateRef },
              select: {
                id: true,
                isActive: true,
                commissionPerCustomerRegistration: true
              }
            })

            if (influencer && influencer.isActive) {
              // Find the click record
              const click = await prisma.affiliateClick.findFirst({
                where: {
                  influencerId: influencer.id,
                  cookieId: cookieId
                },
                orderBy: {
                  clickedAt: 'desc'
                }
              })

              if (click) {
                await prisma.affiliateConversion.create({
                  data: {
                    influencerId: influencer.id,
                    clickId: click.id,
                    cookieId: cookieId,
                    customerId: user.customer.id,
                    type: 'REGISTRATION',
                    commissionAmount: influencer.commissionPerCustomerRegistration,
                    convertedAt: new Date(),
                    isPaid: false
                  }
                })
                
                console.log(`[AFFILIATE] First login conversion tracked: ${affiliateRef} - Customer ${user.email} - €${influencer.commissionPerCustomerRegistration / 100}`)
              }
            }
          }
        }
      } catch (conversionError) {
        console.error('[AFFILIATE] Error tracking conversion on login:', conversionError)
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id,
        workshopId: user.workshop?.id,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Return user data and token
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerId: user.customer?.id,
        workshopId: user.workshop?.id,
      }
    })

  } catch (error) {
    console.error('Mobile login error:', error)
    return NextResponse.json(
      { error: 'Anmeldefehler' },
      { status: 500 }
    )
  }
}
