import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto/encryption'

/**
 * Test Workshop Supplier Connection
 * POST /api/workshop/suppliers/test
 * 
 * Tests the connection to TyreSystem API with workshop's encrypted credentials
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { supplier } = await request.json()

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier parameter required' },
        { status: 400 }
      )
    }

    // Get workshop supplier credentials
    const workshopSupplier = await prisma.workshopSupplier.findUnique({
      where: {
        workshopId_supplier: {
          workshopId: session.user.id,
          supplier: supplier,
        },
      },
    })

    if (!workshopSupplier) {
      return NextResponse.json(
        { error: 'Supplier credentials not found' },
        { status: 404 }
      )
    }

    if (!workshopSupplier.isActive) {
      return NextResponse.json(
        { error: 'Supplier is not active' },
        { status: 400 }
      )
    }

    // Decrypt credentials
    const username = decrypt(workshopSupplier.usernameEncrypted, workshopSupplier.encryptionIv)
    const password = decrypt(workshopSupplier.passwordEncrypted, workshopSupplier.encryptionIv)

    // Test API connection with a simple inquiry
    const testArticleId = '222' // Example article from TyreSystem docs
    const amount = '1'
    
    const authHeader = Buffer.from(`${username}:${password}`).toString('base64')
    
    const apiResponse = await fetch(
      `https://api.tyresystem.de/Rest/Inquiry/${testArticleId}/${amount}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!apiResponse.ok) {
      // Update supplier with error
      await prisma.workshopSupplier.update({
        where: { id: workshopSupplier.id },
        data: {
          lastApiError: `API returned status ${apiResponse.status}`,
        },
      })

      return NextResponse.json(
        { 
          success: false,
          error: `TyreSystem API returned status ${apiResponse.status}`,
          details: await apiResponse.text(),
        },
        { status: 502 }
      )
    }

    const data = await apiResponse.json()

    // Update supplier with successful check
    await prisma.workshopSupplier.update({
      where: { id: workshopSupplier.id },
      data: {
        lastApiCheck: new Date(),
        lastApiError: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      testData: data,
    })
  } catch (error) {
    console.error('Error testing supplier connection:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
