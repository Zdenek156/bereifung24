import { prisma } from '@/lib/prisma'
import { SocialMediaPlatform } from '@prisma/client'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`
const INSTAGRAM_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`
const THREADS_API_BASE = 'https://graph.threads.net/v1.0'
const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest'
const LINKEDIN_VERSION = '202504'

interface EngagementData {
  likes?: number
  shares?: number
  comments?: number
  clicks?: number
  reach?: number
  impressions?: number
}

// ============================================
// FACEBOOK ENGAGEMENT
// ============================================

async function fetchFacebookEngagement(
  platformPostId: string,
  accessToken: string
): Promise<EngagementData> {
  try {
    const url = `${GRAPH_API_BASE}/${platformPostId}?fields=likes.summary(true),comments.summary(true)&access_token=${accessToken}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      console.error('[Engagement] Facebook error:', data.error.message)
      return {}
    }

    return {
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
    }
  } catch (error: any) {
    console.error('[Engagement] Facebook exception:', error.message)
    return {}
  }
}

// ============================================
// INSTAGRAM ENGAGEMENT
// ============================================

async function fetchInstagramEngagement(
  platformPostId: string,
  accessToken: string
): Promise<EngagementData> {
  try {
    // Detect API base from token
    const apiBase = accessToken.startsWith('IGAAg') ? INSTAGRAM_API_BASE : GRAPH_API_BASE
    const url = `${apiBase}/${platformPostId}?fields=like_count,comments_count&access_token=${accessToken}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      console.error('[Engagement] Instagram error:', data.error.message)
      return {}
    }

    return {
      likes: data.like_count || 0,
      comments: data.comments_count || 0,
    }
  } catch (error: any) {
    console.error('[Engagement] Instagram exception:', error.message)
    return {}
  }
}

// ============================================
// THREADS ENGAGEMENT
// ============================================

async function fetchThreadsEngagement(
  platformPostId: string,
  accessToken: string
): Promise<EngagementData> {
  try {
    // Threads Insights API
    const url = `${THREADS_API_BASE}/${platformPostId}/insights?metric=views,likes,replies,reposts&access_token=${accessToken}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      console.error('[Engagement] Threads error:', data.error.message)
      return {}
    }

    const metrics: EngagementData = {}
    if (data.data) {
      for (const metric of data.data) {
        switch (metric.name) {
          case 'views':
            metrics.impressions = metric.values?.[0]?.value || 0
            break
          case 'likes':
            metrics.likes = metric.values?.[0]?.value || 0
            break
          case 'replies':
            metrics.comments = metric.values?.[0]?.value || 0
            break
          case 'reposts':
            metrics.shares = metric.values?.[0]?.value || 0
            break
        }
      }
    }

    return metrics
  } catch (error: any) {
    console.error('[Engagement] Threads exception:', error.message)
    return {}
  }
}

// ============================================
// LINKEDIN ENGAGEMENT
// ============================================

async function fetchLinkedinEngagement(
  platformPostId: string,
  accessToken: string
): Promise<EngagementData> {
  try {
    // LinkedIn Social Actions API
    const encodedUrn = encodeURIComponent(platformPostId)
    const url = `${LINKEDIN_REST_BASE}/socialActions/${encodedUrn}?fields=likesSummary,commentsSummary`
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    })
    const data = await res.json()

    if (!res.ok) {
      console.error('[Engagement] LinkedIn error:', JSON.stringify(data).substring(0, 200))
      return {}
    }

    return {
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
    }
  } catch (error: any) {
    console.error('[Engagement] LinkedIn exception:', error.message)
    return {}
  }
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

export async function syncEngagement() {
  // Get all published platform posts with their accounts (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const platformPosts = await prisma.socialMediaPostPlatform.findMany({
    where: {
      status: 'PUBLISHED',
      platformPostId: { not: null },
      publishedAt: { gte: thirtyDaysAgo },
    },
    include: {
      account: {
        select: {
          platform: true,
          accessToken: true,
          pageId: true,
          isActive: true,
        },
      },
    },
  })

  console.log(`[Engagement Sync] Found ${platformPosts.length} published posts to sync`)

  let updated = 0
  let errors = 0

  for (const pp of platformPosts) {
    if (!pp.account.isActive || !pp.account.accessToken || !pp.platformPostId) {
      continue
    }

    let engagement: EngagementData = {}

    try {
      switch (pp.account.platform) {
        case SocialMediaPlatform.FACEBOOK:
          engagement = await fetchFacebookEngagement(pp.platformPostId, pp.account.accessToken)
          break
        case SocialMediaPlatform.INSTAGRAM:
          engagement = await fetchInstagramEngagement(pp.platformPostId, pp.account.accessToken)
          break
        case SocialMediaPlatform.THREADS:
          engagement = await fetchThreadsEngagement(pp.platformPostId, pp.account.accessToken)
          break
        case SocialMediaPlatform.LINKEDIN:
          engagement = await fetchLinkedinEngagement(pp.platformPostId, pp.account.accessToken)
          break
        default:
          continue
      }

      // Only update if we got data
      if (Object.keys(engagement).length > 0) {
        await prisma.socialMediaPostPlatform.update({
          where: { id: pp.id },
          data: {
            likes: engagement.likes ?? pp.likes,
            shares: engagement.shares ?? pp.shares,
            comments: engagement.comments ?? pp.comments,
            clicks: engagement.clicks ?? pp.clicks,
            reach: engagement.reach ?? pp.reach,
            impressions: engagement.impressions ?? pp.impressions,
          },
        })
        updated++
      }
    } catch (error: any) {
      console.error(`[Engagement Sync] Error for ${pp.account.platform} post ${pp.platformPostId}:`, error.message)
      errors++
    }
  }

  console.log(`[Engagement Sync] Done: ${updated} updated, ${errors} errors`)

  return { total: platformPosts.length, updated, errors }
}
