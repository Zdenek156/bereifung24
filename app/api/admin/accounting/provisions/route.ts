import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  createProvision, 
  getProvisionsByYear, 
  getActiveProvisions,
  getProvisionsByType 
} from '@/lib/accounting/provisionService'
import { ProvisionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/provisions
 * Fetch provisions with optional filtering
 * Query params: year, type, active
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const type = searchParams.get('type') as ProvisionType | null
    const active = searchParams.get('active')

    // Use specific service functions when available
    if (active === 'true') {
      const provisions = await getActiveProvisions()
      return NextResponse.json({
        success: true,
        data: provisions
      })
    }

    if (year) {
      const provisions = await getProvisionsByYear(parseInt(year))
      return NextResponse.json({
        success: true,
        data: provisions
      })
    }

    if (type && Object.values(ProvisionType).includes(type)) {
      const provisions = await getProvisionsByType(type)
      return NextResponse.json({
        success: true,
        data: provisions
      })
    }

    // Default: fetch all provisions
    const provisions = await prisma.provision.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: provisions
    })
  } catch (error) {
    console.error('Error fetching provisions:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/provisions
 * Create new provision
 * Body: { type: ProvisionType, amount: number, year: number, description: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📥 Provision POST request body:', JSON.stringify(body, null, 2))
    
    const { type, amount, year, description, reason } = body

    if (!type || !amount || !year || !description) {
      console.error('❌ Missing required fields:', { type, amount, year, description })
      return NextResponse.json(
        { success: false, error: 'Type, amount, year, and description are required' },
        { status: 400 }
      )
    }

    if (!Object.values(ProvisionType).includes(type)) {
      console.error('❌ Invalid provision type:', type, 'Valid types:', Object.values(ProvisionType))
      return NextResponse.json(
        { success: false, error: `Invalid provision type: ${type}` },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      console.error('❌ Invalid amount:', amount, 'Type:', typeof amount)
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    console.log('✅ Creating provision with:', { type, amount, year, description, reason })
    const provision = await createProvision(type, amount, year, description, reason, session.user.id)
    console.log('✅ Provision created successfully:', provision.id)

    return NextResponse.json({
      success: true,
      data: provision
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating provision:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })

    if (error instanceof Error && error.message.includes('must be greater')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
