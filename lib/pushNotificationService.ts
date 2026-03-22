/**
 * Push Notification Service
 * 
 * Uses FCM HTTP v1 API as transport layer.
 * Next.js backend decides WHEN and TO WHOM notifications are sent.
 * 
 * Required env vars:
 *   FIREBASE_PROJECT_ID        - Firebase project ID (e.g., "bereifung24-app")
 *   FIREBASE_SERVICE_ACCOUNT   - JSON string of the service account key
 * 
 * Setup:
 *   1. Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 *   2. Copy the JSON content into FIREBASE_SERVICE_ACCOUNT env var
 *   3. Set FIREBASE_PROJECT_ID to your project ID
 */

import { prisma } from '@/lib/prisma'

const FCM_V1_URL = (projectId: string) =>
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

// ── OAuth2 Access Token (from Service Account JWT) ──

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth2 access token for FCM using service account (JWT → access token exchange)
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set')
  }

  const sa = JSON.parse(serviceAccountJson)

  // Build JWT
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: sa.client_email,
    scope: FCM_SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedClaim = base64url(JSON.stringify(claim))
  const signatureInput = `${encodedHeader}.${encodedClaim}`

  // Sign with RSA private key
  const crypto = await import('crypto')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signatureInput)
  const signature = sign.sign(sa.private_key, 'base64url')

  const jwt = `${signatureInput}.${signature}`

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OAuth2 token exchange failed: ${error}`)
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return cachedToken.token
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── FCM Message Types ──

interface FcmNotification {
  title: string
  body: string
}

interface FcmMessage {
  token: string
  notification: FcmNotification
  data?: Record<string, string>
  android?: {
    priority: 'high' | 'normal'
    notification?: {
      channel_id?: string
      icon?: string
      color?: string
    }
  }
}

// ── Send Functions ──

/**
 * Send a single FCM message
 */
async function sendFcmMessage(message: FcmMessage): Promise<{ success: boolean; error?: string }> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) {
    return { success: false, error: 'FIREBASE_PROJECT_ID not set' }
  }

  try {
    const accessToken = await getAccessToken()

    const response = await fetch(FCM_V1_URL(projectId), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[FCM] Send failed:', response.status, errorBody)
      return { success: false, error: `FCM ${response.status}: ${errorBody}` }
    }

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[FCM] Send error:', msg)
    return { success: false, error: msg }
  }
}

// ── Public API ──

export interface PushPayload {
  title: string
  body: string
  type: string // booking_confirmation, booking_reminder, season_tip, booking_update, manual
  data?: Record<string, string> // Extra data (e.g., { id: bookingId })
}

/**
 * Send push notification to a specific user
 */
export async function sendToUser(
  userId: string,
  payload: PushPayload,
  sentBy?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fcmToken: true,
      notifyBookingConfirmation: true,
      notifyReminder: true,
      notifySeason: true,
      notifyBookingUpdate: true,
    },
  })

  if (!user?.fcmToken) {
    return { success: false, error: 'Kein FCM Token vorhanden' }
  }

  // Check user notification preferences
  if (!shouldNotify(user, payload.type)) {
    return { success: false, error: 'Benachrichtigung vom Nutzer deaktiviert' }
  }

  const result = await sendFcmMessage({
    token: user.fcmToken,
    notification: { title: payload.title, body: payload.body },
    data: { type: payload.type, ...payload.data },
    android: {
      priority: 'high',
      notification: {
        channel_id: 'bereifung24_main',
        icon: 'ic_launcher',
        color: '#0284C7',
      },
    },
  })

  // Log to database
  await prisma.pushNotificationLog.create({
    data: {
      userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data ?? undefined,
      fcmToken: user.fcmToken.substring(0, 20) + '...', // Truncate for privacy
      status: result.success ? 'SENT' : 'FAILED',
      error: result.error,
      sentBy,
    },
  })

  return result
}

/**
 * Send push notification to multiple users
 */
export async function sendToUsers(
  userIds: string[],
  payload: PushPayload,
  sentBy?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const userId of userIds) {
    const result = await sendToUser(userId, payload, sentBy)
    if (result.success) {
      sent++
    } else {
      failed++
      if (result.error) errors.push(`${userId}: ${result.error}`)
    }
  }

  return { sent, failed, errors }
}

/**
 * Broadcast push notification to all users with FCM tokens
 */
export async function broadcastToAll(
  payload: PushPayload,
  sentBy?: string
): Promise<{ sent: number; failed: number; total: number }> {
  const users = await prisma.user.findMany({
    where: {
      fcmToken: { not: null },
    },
    select: { id: true },
  })

  let sent = 0
  let failed = 0

  for (const user of users) {
    const result = await sendToUser(user.id, payload, sentBy)
    if (result.success) sent++
    else failed++
  }

  // Log broadcast summary
  await prisma.pushNotificationLog.create({
    data: {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data ?? undefined,
      status: 'SENT',
      isBroadcast: true,
      sentBy,
    },
  })

  return { sent, failed, total: users.length }
}

// ── Notification Templates ──

/**
 * Send booking reminder (24h before)
 */
export async function notifyBookingReminder(userId: string, bookingId: string, workshopName: string, date: string, time: string) {
  return sendToUser(userId, {
    title: 'Terminerinnerung 🔔',
    body: `Morgen um ${time} Uhr: Reifenservice bei ${workshopName}. Vergessen Sie nicht Ihren Termin!`,
    type: 'booking_reminder',
    data: { id: bookingId },
  })
}

/**
 * Send booking status update
 */
export async function notifyBookingUpdate(userId: string, bookingId: string, status: string) {
  const statusTexts: Record<string, string> = {
    CONFIRMED: 'Ihre Buchung wurde bestätigt.',
    COMPLETED: 'Ihr Reifenservice wurde abgeschlossen.',
    CANCELLED: 'Ihre Buchung wurde storniert.',
  }

  return sendToUser(userId, {
    title: 'Buchungs-Update',
    body: statusTexts[status] || `Status: ${status}`,
    type: 'booking_update',
    data: { id: bookingId },
  })
}

/**
 * Send season tip to all users
 */
export async function notifySeasonTip(title: string, body: string, sentBy?: string) {
  return broadcastToAll(
    { title, body, type: 'season_tip' },
    sentBy
  )
}

/**
 * Send review request (2h after appointment)
 */
export async function notifyReviewRequest(userId: string, bookingId: string, workshopName: string) {
  return sendToUser(userId, {
    title: 'Wie war Ihr Besuch? ⭐',
    body: `Bewerten Sie Ihren Termin bei ${workshopName} — Ihr Feedback hilft anderen Kunden!`,
    type: 'review_prompt',
    data: { id: bookingId },
  })
}

// ── Helper ──

function shouldNotify(
  prefs: {
    notifyBookingConfirmation: boolean
    notifyReminder: boolean
    notifySeason: boolean
    notifyBookingUpdate: boolean
  },
  type: string
): boolean {
  switch (type) {
    case 'booking_confirmation':
      return prefs.notifyBookingConfirmation
    case 'booking_reminder':
      return prefs.notifyReminder
    case 'season_tip':
      return prefs.notifySeason
    case 'booking_update':
      return prefs.notifyBookingUpdate
    case 'manual':
      return true // Manual notifications always go through
    case 'review_prompt':
      return true // Review prompts always go through
    default:
      return true
  }
}

// ── Stats ──

export async function getNotificationStats() {
  const [total, sent, failed, uniqueUsers, broadcasts] = await Promise.all([
    prisma.pushNotificationLog.count(),
    prisma.pushNotificationLog.count({ where: { status: 'SENT' } }),
    prisma.pushNotificationLog.count({ where: { status: 'FAILED' } }),
    prisma.pushNotificationLog.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
    }),
    prisma.pushNotificationLog.count({ where: { isBroadcast: true } }),
  ])

  const usersWithTokens = await prisma.user.count({
    where: { fcmToken: { not: null } },
  })

  return {
    total,
    sent,
    failed,
    uniqueUsers: uniqueUsers.length,
    broadcasts,
    usersWithTokens,
  }
}

export async function getRecentNotifications(limit = 50) {
  return prisma.pushNotificationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
