import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * DEBUG: Reset influencer password to a known value
 * POST /api/debug/reset-influencer-password
 */
export async function POST(request: NextRequest) {
  try {
    const tempPassword = 'TempPassword123!'
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    
    const result = await prisma.influencer.update({
      where: { email: 'zdenek156@gmail.com' },
      data: {
        password: hashedPassword,
        isRegistered: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
      tempPassword: tempPassword,
      email: result.email
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
