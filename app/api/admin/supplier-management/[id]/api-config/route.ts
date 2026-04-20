import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/admin/supplier-management/[id]/api-config - Update API configuration
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
      apiMode, apiEndpoint, apiTestEndpoint, authType,
      apiUsername, apiPassword, apiKey,
      csvDownloadUrl, csvFormat, csvAutoUpdate, csvUpdateSchedule,
    } = body

    const config = await prisma.supplierApiConfig.upsert({
      where: { supplierId: params.id },
      create: {
        supplierId: params.id,
        apiMode: apiMode || 'NONE',
        apiEndpoint: apiEndpoint || null,
        apiTestEndpoint: apiTestEndpoint || null,
        authType: authType || null,
        apiUsername: apiUsername || null,
        apiPassword: apiPassword || null,
        apiKey: apiKey || null,
        csvDownloadUrl: csvDownloadUrl || null,
        csvFormat: csvFormat || null,
        csvAutoUpdate: csvAutoUpdate || false,
        csvUpdateSchedule: csvUpdateSchedule || null,
      },
      update: {
        ...(apiMode !== undefined && { apiMode }),
        ...(apiEndpoint !== undefined && { apiEndpoint: apiEndpoint || null }),
        ...(apiTestEndpoint !== undefined && { apiTestEndpoint: apiTestEndpoint || null }),
        ...(authType !== undefined && { authType: authType || null }),
        ...(apiUsername !== undefined && { apiUsername: apiUsername || null }),
        ...(apiPassword !== undefined && { apiPassword: apiPassword || null }),
        ...(apiKey !== undefined && { apiKey: apiKey || null }),
        ...(csvDownloadUrl !== undefined && { csvDownloadUrl: csvDownloadUrl || null }),
        ...(csvFormat !== undefined && { csvFormat: csvFormat || null }),
        ...(csvAutoUpdate !== undefined && { csvAutoUpdate }),
        ...(csvUpdateSchedule !== undefined && { csvUpdateSchedule: csvUpdateSchedule || null }),
      },
    })

    console.log(`✅ [Supplier Management] API config updated for supplier ${params.id}`)
    return NextResponse.json(config)
  } catch (error) {
    console.error('❌ [Supplier Management] Error updating API config:', error)
    return NextResponse.json({ error: 'Failed to update API config' }, { status: 500 })
  }
}
