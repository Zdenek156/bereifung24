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
          post.imageUrl
        )
        break

      case SocialMediaPlatform.INSTAGRAM:
        result = await publishToInstagram(
          account.pageId,
          account.accessToken,
          fullContent,
          post.imageUrl
        )
        break

      case SocialMediaPlatform.THREADS:
        result = await publishToThreads(
          account.pageId,
          account.accessToken,
          fullContent,
          post.imageUrl
        )
        break

      case SocialMediaPlatform.LINKEDIN:
        result = await publishToLinkedin(
          account.pageId,
          account.accessToken,
          fullContent,
          post.imageUrl
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
// LINKEDIN PUBLISHING
// ============================================

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

async function publishToLinkedin(
  organizationId: string,
  accessToken: string,
  content: string,
  imageUrl?: string | null
): Promise<PublishResult> {
  try {
    // LinkedIn uses URN format for organizations: urn:li:organization:{id}
    const authorUrn = organizationId.startsWith('urn:li:')
      ? organizationId
      : `urn:li:organization:${organizationId}`

    if (imageUrl) {
      // Step 1: Register image upload
      const registerRes = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorUrn,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            }],
          },
        }),
      })
      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        console.error('[Social Media] LinkedIn register upload error:', registerData)
        return { success: false, error: registerData.message || `Upload Register HTTP ${registerRes.status}` }
      }

      const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
      const asset = registerData.value?.asset

      if (!uploadUrl || !asset) {
        return { success: false, error: 'LinkedIn Upload-URL konnte nicht ermittelt werden' }
      }

      // Step 2: Download image and upload to LinkedIn
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg',
        },
        body: imageBuffer,
      })

      if (!uploadRes.ok) {
        return { success: false, error: `LinkedIn Bild-Upload fehlgeschlagen: HTTP ${uploadRes.status}` }
      }

      // Step 3: Create post with image
      const postRes = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: 'IMAGE',
              media: [{
                status: 'READY',
                media: asset,
              }],
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      })
      const postData = await postRes.json()

      if (!postRes.ok || postData.serviceErrorCode) {
        const errorMsg = postData.message || `HTTP ${postRes.status}`
        console.error('[Social Media] LinkedIn publish error:', errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true, platformPostId: postData.id }
    } else {
      // Text-only post
      const postRes = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      })
      const postData = await postRes.json()

      if (!postRes.ok || postData.serviceErrorCode) {
        const errorMsg = postData.message || `HTTP ${postRes.status}`
        console.error('[Social Media] LinkedIn publish error:', errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true, platformPostId: postData.id }
    }
  } catch (error: any) {
    console.error('[Social Media] LinkedIn publish exception:', error)
    return { success: false, error: error.message }
  }
}

export async function verifyLinkedinToken(organizationId: string, accessToken: string) {
  try {
    // Verify token by getting organization info
    const orgUrn = organizationId.startsWith('urn:li:')
      ? organizationId
      : `urn:li:organization:${organizationId}`

    const response = await fetch(
      `${LINKEDIN_API_BASE}/organizations/${organizationId.replace(/^urn:li:organization:/, '')}?projection=(id,localizedName,vanityName,logoV2)`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    )
    const data = await response.json()

    if (!response.ok || data.serviceErrorCode) {
      return { valid: false, error: data.message || `HTTP ${response.status}` }
    }

    return { valid: true, orgName: data.localizedName, orgId: data.id?.toString() }
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
