import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Returns legal text with HTML content wrapped in a mobile-friendly
// HTML template for rendering in WebView, or as raw HTML
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key.toLowerCase()

    const validKeys = ['agb', 'impressum', 'datenschutz']
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
    }

    const legal = await prisma.legalText.findUnique({
      where: { key },
      select: {
        key: true,
        title: true,
        content: true,
        version: true,
        updatedAt: true,
      },
    })

    if (!legal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const format = request.nextUrl.searchParams.get('format')

    // For Flutter app: return full HTML page for WebView rendering
    if (format === 'html') {
      const htmlPage = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${legal.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #374151;
    padding: 16px;
    background: #fff;
  }
  h1 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 16px; }
  h2 { font-size: 20px; font-weight: 700; color: #111827; margin-top: 24px; margin-bottom: 12px; }
  h3 { font-size: 17px; font-weight: 600; color: #111827; margin-top: 16px; margin-bottom: 8px; }
  p { margin-bottom: 10px; }
  ul, ol { margin-left: 20px; margin-bottom: 10px; }
  li { margin-bottom: 4px; }
  section { margin-bottom: 20px; }
  a { color: #2563eb; text-decoration: none; }
  .bg-gray-50, [class*="bg-gray"] {
    background-color: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  strong, b, .font-semibold, .font-bold { font-weight: 600; }
  .text-sm { font-size: 13px; }
  .text-gray-600 { color: #6b7280; }
  .text-primary-600 { color: #2563eb; }
  .mb-3 { margin-bottom: 12px; }
  .mt-6 { margin-top: 24px; }
  .text-2xl { font-size: 20px; }
  .text-xl { font-size: 17px; }
</style>
</head>
<body>
<h1>${legal.title}</h1>
${legal.content}
<p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
  Version ${legal.version} · Aktualisiert: ${new Date(legal.updatedAt).toLocaleDateString('de-DE')}
</p>
</body>
</html>`

      return new Response(htmlPage, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    // Default: JSON response
    return NextResponse.json(legal, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching legal text:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
