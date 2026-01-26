import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import XLSX from 'xlsx'

// Required for Route Handlers to work properly
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow both ADMIN and B24_EMPLOYEE
    if (!session?.user || !['ADMIN', 'B24_EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Get Regional category
    let regionalCategory = await prisma.blogCategory.findFirst({
      where: { slug: 'regional' }
    })

    if (!regionalCategory) {
      // Create Regional category if it doesn't exist
      regionalCategory = await prisma.blogCategory.create({
        data: {
          name: 'Regional',
          slug: 'regional',
          description: 'Lokale Informationen und Services',
          icon: '📍',
          color: '#10b981',
          sortOrder: 3
        }
      })
    }

    // Get first employee as author
    const author = await prisma.b24Employee.findFirst({
      where: { 
        status: { not: 'TERMINATED' }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (!author) {
      return NextResponse.json({ error: 'Kein Autor gefunden' }, { status: 400 })
    }

    const results = {
      success: true,
      created: 0,
      skipped: 0,
      errors: [] as string[],
      articles: [] as Array<{ title: string; slug: string }>
    }

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        // Get content from row 3 (index 2)
        if (data.length < 3 || !data[2] || !data[2][0]) {
          results.errors.push(`Sheet "${sheetName}": Kein Content in Zeile 3`)
          continue
        }

        const htmlContent = data[2][0].toString()

        // Extract title from H1 tag
        const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i)
        const title = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : `Reifenwechsel ${sheetName}`

        // Generate slug from sheet name
        const baseSlug = `reifenwechsel-${sheetName
          .toLowerCase()
          .replace(/[äÄ]/g, 'ae')
          .replace(/[öÖ]/g, 'oe')
          .replace(/[üÜ]/g, 'ue')
          .replace(/ß/g, 'ss')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')}`

        // Check if article already exists
        const existing = await prisma.blogPost.findFirst({
          where: { slug: baseSlug }
        })

        if (existing) {
          results.skipped++
          results.errors.push(`Artikel "${title}" existiert bereits (Slug: ${baseSlug})`)
          continue
        }

        // Extract excerpt from lead paragraph
        const leadMatch = htmlContent.match(/<p class="lead">(.*?)<\/p>/i)
        const excerpt = leadMatch 
          ? leadMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 160)
          : `Reifenwechsel in ${sheetName}: Vergleichen Sie Preise, buchen Sie online und sparen Sie bis zu 40%.`

        // Calculate read time (words / 200 wpm)
        const wordCount = htmlContent.replace(/<[^>]*>/g, ' ').split(/\s+/).length
        const readTime = Math.max(1, Math.ceil(wordCount / 200))

        // Create or get tags
        const tagNames = [sheetName, 'Reifenwechsel', 'Stuttgart']
        const tags = await Promise.all(
          tagNames.map(async (tagName) => {
            const tagSlug = tagName
              .toLowerCase()
              .replace(/[äÄ]/g, 'ae')
              .replace(/[öÖ]/g, 'oe')
              .replace(/[üÜ]/g, 'ue')
              .replace(/ß/g, 'ss')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')

            let tag = await prisma.blogTag.findUnique({
              where: { slug: tagSlug }
            })

            if (!tag) {
              tag = await prisma.blogTag.create({
                data: {
                  name: tagName,
                  slug: tagSlug
                }
              })
            }

            return tag
          })
        )

        // Create blog post
        const post = await prisma.blogPost.create({
          data: {
            title,
            slug: baseSlug,
            excerpt,
            content: htmlContent,
            status: 'DRAFT',
            targetAudience: 'CUSTOMER',
            readTime,
            views: 0,
            metaTitle: title,
            metaDescription: excerpt,
            keywords: tagNames,
            categoryId: regionalCategory.id,
            authorId: author.id,
            tags: {
              connect: tags.map(tag => ({ id: tag.id }))
            }
          }
        })

        results.created++
        results.articles.push({
          title: post.title,
          slug: post.slug
        })

      } catch (error: any) {
        results.errors.push(`Sheet "${sheetName}": ${error.message}`)
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Excel upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Verarbeiten der Excel-Datei' },
      { status: 500 }
    )
  }
}
