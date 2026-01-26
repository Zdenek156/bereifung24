import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ArticleDetail from './ArticleDetail'

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug: params.slug,
      status: 'PUBLISHED'
    },
    include: {
      category: true,
      author: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  })

  if (!post) {
    return {
      title: 'Artikel nicht gefunden | Bereifung24'
    }
  }

  return {
    title: post.metaTitle || `${post.title} | Bereifung24`,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords || '',
    alternates: {
      canonical: post.canonicalUrl || `https://bereifung24.de/ratgeber/${post.slug}`
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author ? [`${post.author.firstName} ${post.author.lastName}`] : [],
      images: post.featuredImage ? [{ url: post.featuredImage, alt: post.imageAlt || post.title }] : [],
      url: `https://bereifung24.de/ratgeber/${post.slug}`
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : []
    }
  }
}

export const revalidate = 300 // Revalidate every 5 minutes

async function getArticleData(slug: string) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        targetAudience: { in: ['CUSTOMER', 'BOTH'] }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        },
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tags: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    if (!post) {
      return null
    }

    // Get related posts from same category
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        targetAudience: { in: ['CUSTOMER', 'BOTH'] },
        categoryId: post.categoryId,
        id: { not: post.id }
      },
      take: 3,
      orderBy: { views: 'desc' },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            icon: true,
            color: true
          }
        }
      }
    })

    return { post, relatedPosts }
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export default async function ArticlePage({ params }: Props) {
  const data = await getArticleData(params.slug)

  if (!data) {
    notFound()
  }

  return <ArticleDetail {...data} />
}
