import { NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'

// GET /api/freelancer/affiliate-link - Get personal affiliate link + QR code
export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const baseUrl = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
  const affiliateLink = `${baseUrl}/register/workshop?ref=${freelancer.affiliateCode}`
  
  // Generate QR code URL using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}`

  return NextResponse.json({
    affiliateCode: freelancer.affiliateCode,
    affiliateLink,
    qrCodeUrl,
  })
}
