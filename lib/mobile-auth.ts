import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.NEXTAUTH_SECRET!
const ACCESS_TOKEN_EXPIRY = '30d'
const REFRESH_TOKEN_EXPIRY_DAYS = 90

export interface MobileTokenPayload {
  userId: string
  email: string
  role: string
  firstName: string
  lastName: string
  customerId?: string
  workshopId?: string
}

/**
 * Sign a new access token (30 days)
 */
export function signAccessToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

/**
 * Generate a cryptographically secure refresh token and store it in the database
 * Returns the raw token string (90 days validity)
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(64).toString('hex')
  const expiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: rawToken,
      refreshTokenExpiry: expiry,
    },
  })

  return rawToken
}

/**
 * Verify an access token and return the decoded payload
 */
export function verifyAccessToken(token: string): MobileTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileTokenPayload & jwt.JwtPayload
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      customerId: decoded.customerId,
      workshopId: decoded.workshopId,
    }
  } catch {
    return null
  }
}

/**
 * Validate a refresh token against the database
 * Returns the user if valid, null otherwise
 */
export async function validateRefreshToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { refreshToken: token },
    include: { customer: true, workshop: true },
  })

  if (!user) return null
  if (!user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) return null
  if (!user.isActive) return null

  return user
}

/**
 * Revoke a user's refresh token (e.g. on logout)
 */
export async function revokeRefreshToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null, refreshTokenExpiry: null },
  })
}

/**
 * Build the token payload from a user + relations
 */
export function buildTokenPayload(user: {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  customer?: { id: string } | null
  workshop?: { id: string } | null
}): MobileTokenPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    customerId: user.customer?.id,
    workshopId: user.workshop?.id,
  }
}

/**
 * Issue both access + refresh tokens and return them along with user data
 */
export async function issueTokenPair(user: {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  phone?: string | null
  street?: string | null
  zipCode?: string | null
  city?: string | null
  profileImage?: string | null
  customer?: { id: string } | null
  workshop?: { id: string } | null
}) {
  const payload = buildTokenPayload(user)
  const accessToken = signAccessToken(payload)
  const refreshToken = await generateRefreshToken(user.id)

  // Update last app login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastAppLogin: new Date() },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone || null,
      street: user.street || null,
      zipCode: user.zipCode || null,
      city: user.city || null,
      profileImage: user.profileImage || null,
      customerId: user.customer?.id,
      workshopId: user.workshop?.id,
    },
  }
}

/**
 * Extract Bearer token from a NextRequest and verify it
 * Returns the decoded payload or null
 */
export function authenticateMobileRequest(request: NextRequest): MobileTokenPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  return verifyAccessToken(token)
}
