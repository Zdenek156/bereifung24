import { prisma } from '@/lib/prisma'
import { SocialMediaPostStatus, SocialMediaPostType, SocialMediaPlatform, SocialMediaTrigger } from '@prisma/client'

// ============================================
// POSTS
// ============================================

export async function getPosts(filters?: {
  status?: SocialMediaPostStatus
  postType?: SocialMediaPostType
  page?: number
  limit?: number
}) {
  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (filters?.status) where.status = filters.status
  if (filters?.postType) where.postType = filters.postType

  const [posts, total] = await Promise.all([
    prisma.socialMediaPost.findMany({
      where,
      include: {
        template: { select: { id: true, name: true } },
        automation: { select: { id: true, name: true } },
        platforms: {
          include: {
            account: { select: { id: true, platform: true, accountName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.socialMediaPost.count({ where })
  ])

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getPost(id: string) {
  return prisma.socialMediaPost.findUnique({
    where: { id },
    include: {
      template: true,
      automation: true,
      platforms: {
        include: {
          account: { select: { id: true, platform: true, accountName: true } }
        }
      }
    }
  })
}

export async function createPost(data: {
  title?: string
  content: string
  hashtags?: string
  imageUrl?: string
  videoUrl?: string
  postType: SocialMediaPostType
  scheduledAt?: Date
  templateId?: string
  automationId?: string
  createdById?: string
  accountIds: string[]
}) {
  const { accountIds, ...postData } = data

  const post = await prisma.socialMediaPost.create({
    data: {
      ...postData,
      status: postData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      platforms: {
        create: accountIds.map(accountId => ({
          accountId,
          status: postData.scheduledAt ? 'SCHEDULED' : 'DRAFT'
        }))
      }
    },
    include: {
      platforms: {
        include: {
          account: { select: { id: true, platform: true, accountName: true } }
        }
      }
    }
  })

  return post
}

export async function updatePost(id: string, data: {
  title?: string
  content?: string
  hashtags?: string
  imageUrl?: string
  videoUrl?: string
  postType?: SocialMediaPostType
  scheduledAt?: Date | null
  accountIds?: string[]
}) {
  const { accountIds, ...updateData } = data

  // If accountIds changed, update platform links
  if (accountIds !== undefined) {
    await prisma.socialMediaPostPlatform.deleteMany({ where: { postId: id } })
    await prisma.socialMediaPostPlatform.createMany({
      data: accountIds.map(accountId => ({
        postId: id,
        accountId,
        status: 'DRAFT' as SocialMediaPostStatus,
      }))
    })
  }

  return prisma.socialMediaPost.update({
    where: { id },
    data: updateData,
    include: {
      platforms: {
        include: {
          account: { select: { id: true, platform: true, accountName: true } }
        }
      }
    }
  })
}

export async function deletePost(id: string) {
  return prisma.socialMediaPost.delete({ where: { id } })
}

// ============================================
// ACCOUNTS
// ============================================

export async function getAccounts() {
  return prisma.socialMediaAccount.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { posts: true } }
    }
  })
}

export async function createAccount(data: {
  platform: SocialMediaPlatform
  accountName: string
  pageId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
}) {
  return prisma.socialMediaAccount.create({ data })
}

export async function updateAccount(id: string, data: {
  accountName?: string
  pageId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
  isActive?: boolean
}) {
  return prisma.socialMediaAccount.update({ where: { id }, data })
}

export async function deleteAccount(id: string) {
  return prisma.socialMediaAccount.delete({ where: { id } })
}

// ============================================
// TEMPLATES
// ============================================

export async function getTemplates(postType?: SocialMediaPostType) {
  const where: any = {}
  if (postType) where.postType = postType

  return prisma.socialMediaTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { posts: true, automations: true } }
    }
  })
}

export async function createTemplate(data: {
  name: string
  description?: string
  postType: SocialMediaPostType
  textTemplate: string
  htmlTemplate?: string
  platforms?: SocialMediaPlatform[]
}) {
  return prisma.socialMediaTemplate.create({ data })
}

export async function updateTemplate(id: string, data: {
  name?: string
  description?: string
  postType?: SocialMediaPostType
  textTemplate?: string
  htmlTemplate?: string
  platforms?: SocialMediaPlatform[]
  isActive?: boolean
}) {
  return prisma.socialMediaTemplate.update({ where: { id }, data })
}

export async function deleteTemplate(id: string) {
  return prisma.socialMediaTemplate.delete({ where: { id } })
}

// ============================================
// AUTOMATIONS
// ============================================

export async function getAutomations() {
  return prisma.socialMediaAutomation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { id: true, name: true, postType: true } },
      _count: { select: { posts: true } }
    }
  })
}

export async function createAutomation(data: {
  name: string
  description?: string
  trigger: SocialMediaTrigger
  templateId: string
  platforms?: SocialMediaPlatform[]
  autoPublish?: boolean
}) {
  return prisma.socialMediaAutomation.create({
    data,
    include: {
      template: { select: { id: true, name: true, postType: true } }
    }
  })
}

export async function updateAutomation(id: string, data: {
  name?: string
  description?: string
  trigger?: SocialMediaTrigger
  templateId?: string
  platforms?: SocialMediaPlatform[]
  isActive?: boolean
  autoPublish?: boolean
}) {
  return prisma.socialMediaAutomation.update({
    where: { id },
    data,
    include: {
      template: { select: { id: true, name: true, postType: true } }
    }
  })
}

export async function deleteAutomation(id: string) {
  return prisma.socialMediaAutomation.delete({ where: { id } })
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  const [
    totalPosts,
    draftPosts,
    scheduledPosts,
    publishedPosts,
    failedPosts,
    totalAccounts,
    activeAccounts,
    totalTemplates,
    totalAutomations,
    activeAutomations,
    recentPosts,
  ] = await Promise.all([
    prisma.socialMediaPost.count(),
    prisma.socialMediaPost.count({ where: { status: 'DRAFT' } }),
    prisma.socialMediaPost.count({ where: { status: 'SCHEDULED' } }),
    prisma.socialMediaPost.count({ where: { status: 'PUBLISHED' } }),
    prisma.socialMediaPost.count({ where: { status: 'FAILED' } }),
    prisma.socialMediaAccount.count(),
    prisma.socialMediaAccount.count({ where: { isActive: true } }),
    prisma.socialMediaTemplate.count(),
    prisma.socialMediaAutomation.count(),
    prisma.socialMediaAutomation.count({ where: { isActive: true } }),
    prisma.socialMediaPost.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        platforms: {
          include: {
            account: { select: { platform: true, accountName: true } }
          }
        }
      }
    }),
  ])

  // Engagement totals
  const engagement = await prisma.socialMediaPostPlatform.aggregate({
    _sum: {
      likes: true,
      shares: true,
      comments: true,
      clicks: true,
      reach: true,
      impressions: true
    },
    where: { status: 'PUBLISHED' }
  })

  return {
    posts: { total: totalPosts, draft: draftPosts, scheduled: scheduledPosts, published: publishedPosts, failed: failedPosts },
    accounts: { total: totalAccounts, active: activeAccounts },
    templates: totalTemplates,
    automations: { total: totalAutomations, active: activeAutomations },
    engagement: {
      likes: engagement._sum.likes || 0,
      shares: engagement._sum.shares || 0,
      comments: engagement._sum.comments || 0,
      clicks: engagement._sum.clicks || 0,
      reach: engagement._sum.reach || 0,
      impressions: engagement._sum.impressions || 0
    },
    recentPosts
  }
}
