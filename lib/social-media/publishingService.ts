import { prisma } from '@/lib/prisma'
import { SocialMediaPostStatus, SocialMediaPlatform } from '@prisma/client'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

interface PublishResult {
  success: boolean
  platformPostId?: string
  error?: string
}

// ============================================
// FACEBOOK PUBLISHING
// ============================================

async function publishToFacebook(
  pageId: string,
  accessToken: string,
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    let url: string
    const params: Record<string, string> = {
      access_token: accessToken,
    }

    if (imageUrl) {
      // Post with image
      url = `${GRAPH_API_BASE}/${pageId}/photos`
      params.caption = content
      params.url = imageUrl
    } else {
      // Text-only post
      url = `${GRAPH_API_BASE}/${pageId}/feed`
      params.message = content
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`
      console.error('[Social Media] Facebook publish error:', errorMsg)
      return { success: false, error: errorMsg }
    }

    return { success: true, platformPostId: data.id || data.post_id }
  } catch (error: any) {
    console.error('[Social Media] Facebook publish exception:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// INSTAGRAM PUBLISHING (via Instagram Business Login API)
// ============================================

const INSTAGRAM_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`

async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    if (!imageUrl) {
      return { success: false, error: 'Instagram erfordert ein Bild für jeden Post' }
    }

    // Detect API base: IGAAg tokens use graph.instagram.com, others use graph.facebook.com
    const apiBase = accessToken.startsWith('IGAAg') ? INSTAGRAM_API_BASE : GRAPH_API_BASE

    // Step 1: Create media container
    const containerUrl = `${apiBase}/${igUserId}/media`
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption: content,
      access_token: accessToken,
    })

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: containerParams.toString(),
    })

    const containerData = await containerResponse.json()

    if (!containerResponse.ok || containerData.error) {
      const errorMsg = containerData.error?.message || `Container HTTP ${containerResponse.status}`
      console.error('[Social Media] Instagram container error:', errorMsg)
      return { success: false, error: errorMsg }
    }

    const creationId = containerData.id
    if (!creationId) {
      return { success: false, error: 'Keine creation_id erhalten' }
    }

    // Step 2: Wait briefly for container processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Step 3: Publish the container
    const publishUrl = `${apiBase}/${igUserId}/media_publish`
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    })

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams.toString(),
    })

    const publishData = await publishResponse.json()

    if (!publishResponse.ok || publishData.error) {
      const errorMsg = publishData.error?.message || `Publish HTTP ${publishResponse.status}`
      console.error('[Social Media] Instagram publish error:', errorMsg)
      return { success: false, error: errorMsg }
    }

    return { success: true, platformPostId: publishData.id }
  } catch (error: any) {
    console.error('[Social Media] Instagram publish exception:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// MAIN PUBLISH FUNCTION
// ============================================

export async function publishPost(postId: string) {
  const post = await prisma.socialMediaPost.findUnique({
    where: { id: postId },
    include: {
      platforms: {
        include: {
          account: true,
        },
      },
    },
  })

  if (!post) {
    throw new Error('Post nicht gefunden')
  }

  if (post.status === SocialMediaPostStatus.PUBLISHED) {
    throw new Error('Post wurde bereits veröffentlicht')
  }

  // Update post status to PUBLISHING
  await prisma.socialMediaPost.update({
    where: { id: postId },
    data: { status: SocialMediaPostStatus.PUBLISHING },
  })

  const fullContent = post.hashtags
    ? `${post.content}\n\n${post.hashtags}`
    : post.content

  // Resolve image URL to absolute public URL
  let absoluteImageUrl: string | null = null
  if (post.imageUrl) {
    if (post.imageUrl.startsWith('http')) {
      absoluteImageUrl = post.imageUrl
    } else {
      // Relative path like /uploads/social-media/xyz.jpg → full URL
      const baseUrl = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
      absoluteImageUrl = `${baseUrl}${post.imageUrl}`
    }
  }

  const results: { accountId: string; result: PublishResult }[] = []

  for (const platformPost of post.platforms) {
    const account = platformPost.account

    if (!account.isActive) {
      results.push({
        accountId: account.id,
        result: { success: false, error: 'Account ist deaktiviert' },
      })
      continue
    }

    if (!account.accessToken) {
      results.push({
        accountId: account.id,
        result: { success: false, error: 'Kein Access Token hinterlegt' },
      })
      continue
    }

    if (!account.pageId) {
      results.push({
        accountId: account.id,
        result: { success: false, error: 'Keine Page-ID / IG User-ID hinterlegt' },
      })
      continue
    }

    // Check token expiration
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      results.push({
        accountId: account.id,
        result: { success: false, error: 'Access Token ist abgelaufen' },
      })
      continue
    }

    let result: PublishResult

    switch (account.platform) {
      case SocialMediaPlatform.FACEBOOK:
        result = await publishToFacebook(
          account.pageId,
          account.accessToken,
          fullContent,
          absoluteImageUrl
        )
        break

      case SocialMediaPlatform.INSTAGRAM:
        result = await publishToInstagram(
          account.pageId,
          account.accessToken,
          fullContent,
          absoluteImageUrl
        )
        break

      case SocialMediaPlatform.THREADS: {
        // Threads has a 500 character limit - truncate if needed
        let threadsContent = fullContent
        if (threadsContent.length > 500) {
          // Try content without hashtags first
          threadsContent = post.content
          if (threadsContent.length > 497) {
            threadsContent = threadsContent.substring(0, 497) + '...'
          }
        }
        result = await publishToThreads(
          account.pageId,
          account.accessToken,
          threadsContent,
          absoluteImageUrl
        )
        break
      }

      case SocialMediaPlatform.LINKEDIN:
        result = await publishToLinkedin(
          account.pageId,
          account.accessToken,
          fullContent,
          absoluteImageUrl
        )
        break

      default:
        result = {
          success: false,
          error: `Plattform ${account.platform} wird noch nicht unterstützt`,
        }
    }

    // Update platform post record
    await prisma.socialMediaPostPlatform.update({
      where: { id: platformPost.id },
      data: {
        status: result.success
          ? SocialMediaPostStatus.PUBLISHED
          : SocialMediaPostStatus.FAILED,
        platformPostId: result.platformPostId || null,
        publishedAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      },
    })

    results.push({ accountId: account.id, result })
  }

  // Determine overall post status
  const anySuccess = results.some((r) => r.result.success)
  const allFailed = results.every((r) => !r.result.success)

  await prisma.socialMediaPost.update({
    where: { id: postId },
    data: {
      status: allFailed
        ? SocialMediaPostStatus.FAILED
        : SocialMediaPostStatus.PUBLISHED,
      publishedAt: anySuccess ? new Date() : null,
    },
  })

  console.log(
    `[Social Media] Post ${postId} published: ${results.filter((r) => r.result.success).length}/${results.length} successful`
  )

  return {
    postId,
    overallStatus: allFailed ? 'FAILED' : 'PUBLISHED',
    results: results.map((r) => ({
      accountId: r.accountId,
      success: r.result.success,
      platformPostId: r.result.platformPostId,
      error: r.result.error,
    })),
  }
}

// ============================================
// PUBLISH SCHEDULED POSTS (for Cron)
// ============================================

export async function publishScheduledPosts() {
  const now = new Date()

  const scheduledPosts = await prisma.socialMediaPost.findMany({
    where: {
      status: SocialMediaPostStatus.SCHEDULED,
      scheduledAt: { lte: now },
    },
    select: { id: true },
  })

  console.log(`[Social Media Cron] Found ${scheduledPosts.length} scheduled posts to publish`)

  const results = []

  for (const post of scheduledPosts) {
    try {
      const result = await publishPost(post.id)
      results.push(result)
    } catch (error: any) {
      console.error(`[Social Media Cron] Error publishing post ${post.id}:`, error.message)
      results.push({ postId: post.id, overallStatus: 'FAILED', error: error.message })
    }
  }

  return results
}

// ============================================
// GET FACEBOOK PAGE INFO (for verification)
// ============================================

export async function verifyFacebookToken(pageId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${pageId}?fields=name,id,access_token&access_token=${encodeURIComponent(accessToken)}`
    )
    const data = await response.json()

    if (data.error) {
      return { valid: false, error: data.error.message }
    }

    return { valid: true, pageName: data.name, pageId: data.id }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}

export async function verifyInstagramToken(igUserId: string, accessToken: string) {
  try {
    // IGAAg tokens use Instagram API, others use Facebook Graph API
    if (accessToken.startsWith('IGAAg')) {
      const response = await fetch(
        `${INSTAGRAM_API_BASE}/me?fields=user_id,username,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
      )
      const data = await response.json()

      if (data.error) {
        return { valid: false, error: data.error.message }
      }

      return { valid: true, username: data.username, igUserId: data.user_id || igUserId }
    }

    const response = await fetch(
      `${GRAPH_API_BASE}/${igUserId}?fields=name,id,username,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
    )
    const data = await response.json()

    if (data.error) {
      return { valid: false, error: data.error.message }
    }

    return { valid: true, username: data.username || data.name, igUserId: data.id }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}

// ============================================
// THREADS PUBLISHING (via Threads API)
// ============================================

// Threads API uses its own versioning (NOT the Facebook Graph API version)
const THREADS_API_BASE = 'https://graph.threads.net/v1.0'

async function publishToThreads(
  threadsUserId: string,
  accessToken: string,
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const containerUrl = `${THREADS_API_BASE}/${threadsUserId}/threads`
    const containerParams: Record<string, string> = {
      text: content,
      access_token: accessToken,
    }

    if (imageUrl) {
      containerParams.media_type = 'IMAGE'
      containerParams.image_url = imageUrl
    } else {
      containerParams.media_type = 'TEXT'
    }

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(containerParams).toString(),
    })

    const containerData = await containerResponse.json()

    if (!containerResponse.ok || containerData.error) {
      const errorMsg = containerData.error?.message || `Container HTTP ${containerResponse.status}`
      console.error('[Social Media] Threads container error:', errorMsg)
      return { success: false, error: errorMsg }
    }

    const creationId = containerData.id
    if (!creationId) {
      return { success: false, error: 'Keine creation_id erhalten' }
    }

    // Step 2: Wait for container processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Step 3: Publish the container
    const publishUrl = `${THREADS_API_BASE}/${threadsUserId}/threads_publish`
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    })

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams.toString(),
    })

    const publishData = await publishResponse.json()

    if (!publishResponse.ok || publishData.error) {
      const errorMsg = publishData.error?.message || `Publish HTTP ${publishResponse.status}`
      console.error('[Social Media] Threads publish error:', errorMsg)
      return { success: false, error: errorMsg }
    }

    return { success: true, platformPostId: publishData.id }
  } catch (error: any) {
    console.error('[Social Media] Threads publish exception:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// LINKEDIN PUBLISHING (Posts API v202401)
// ============================================

const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest'
const LINKEDIN_VERSION = '202504'

function getLinkedinAuthorUrn(pageId: string): string {
  if (pageId.startsWith('urn:li:')) return pageId
  // Numeric IDs = organization, alphanumeric = person (OpenID sub)
  const isOrg = /^\d+$/.test(pageId)
  return isOrg ? `urn:li:organization:${pageId}` : `urn:li:person:${pageId}`
}

async function publishToLinkedin(
  pageId: string,
  accessToken: string,
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    const authorUrn = getLinkedinAuthorUrn(pageId)
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    }

    console.log(`[Social Media] LinkedIn posting as: ${authorUrn}`)

    if (imageUrl) {
      // Step 1: Initialize image upload
      const initRes = await fetch(`${LINKEDIN_REST_BASE}/images?action=initializeUpload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          initializeUploadRequest: { owner: authorUrn },
        }),
      })
      const initData = await initRes.json()

      if (!initRes.ok) {
        console.error('[Social Media] LinkedIn image init error:', initData)
        return { success: false, error: initData.message || `Image Init HTTP ${initRes.status}` }
      }

      const uploadUrl = initData.value?.uploadUrl
      const imageUrn = initData.value?.image

      if (!uploadUrl || !imageUrn) {
        return { success: false, error: 'LinkedIn Upload-URL konnte nicht ermittelt werden' }
      }

      // Step 2: Download image and upload to LinkedIn
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
        },
        body: imageBuffer,
      })

      if (!uploadRes.ok) {
        return { success: false, error: `LinkedIn Bild-Upload fehlgeschlagen: HTTP ${uploadRes.status}` }
      }

      // Step 3: Create post with image
      const postRes = await fetch(`${LINKEDIN_REST_BASE}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          author: authorUrn,
          commentary: content,
          visibility: 'PUBLIC',
          distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
          content: { media: { id: imageUrn } },
          lifecycleState: 'PUBLISHED',
        }),
      })

      if (!postRes.ok) {
        const postData = await postRes.json().catch(() => ({}))
        const errorMsg = postData.message || `HTTP ${postRes.status}`
        console.error('[Social Media] LinkedIn publish error:', errorMsg, postData)
        return { success: false, error: errorMsg }
      }

      const postId = postRes.headers.get('x-restli-id') || postRes.headers.get('x-linkedin-id') || ''
      return { success: true, platformPostId: postId }
    } else {
      // Text-only post
      const postRes = await fetch(`${LINKEDIN_REST_BASE}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          author: authorUrn,
          commentary: content,
          visibility: 'PUBLIC',
          distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
          lifecycleState: 'PUBLISHED',
        }),
      })

      if (!postRes.ok) {
        const postData = await postRes.json().catch(() => ({}))
        const errorMsg = postData.message || `HTTP ${postRes.status}`
        console.error('[Social Media] LinkedIn publish error:', errorMsg, postData)
        return { success: false, error: errorMsg }
      }

      const postId = postRes.headers.get('x-restli-id') || postRes.headers.get('x-linkedin-id') || ''
      return { success: true, platformPostId: postId }
    }
  } catch (error: any) {
    console.error('[Social Media] LinkedIn publish exception:', error)
    return { success: false, error: error.message }
  }
}

export async function verifyLinkedinToken(pageId: string, accessToken: string) {
  try {
    // Verify token by calling userinfo endpoint (works for both person and org tokens)
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const data = await response.json()

    if (!response.ok || data.serviceErrorCode) {
      return { valid: false, error: data.message || `HTTP ${response.status}` }
    }

    return { valid: true, orgName: data.name || data.given_name, orgId: pageId }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}

export async function verifyThreadsToken(threadsUserId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${THREADS_API_BASE}/${threadsUserId}/threads_publishing_limit?fields=quota_usage,config&access_token=${encodeURIComponent(accessToken)}`
    )
    const data = await response.json()

    if (data.error) {
      // Try alternative: get user profile
      const profileResponse = await fetch(
        `${THREADS_API_BASE}/me?fields=id,username,threads_profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
      )
      const profileData = await profileResponse.json()

      if (profileData.error) {
        return { valid: false, error: profileData.error.message }
      }

      return { valid: true, username: profileData.username, threadsUserId: profileData.id }
    }

    return { valid: true, threadsUserId, quotaUsage: data.data?.[0]?.quota_usage }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}
