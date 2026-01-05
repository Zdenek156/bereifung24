import { NextResponse } from 'next/server'

// Cache für Nachrichten (30 Minuten)
let newsCache: {
  data: any[] | null
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 Minuten in Millisekunden

export async function GET() {
  try {
    // Prüfen ob Cache noch gültig ist
    const now = Date.now()
    if (newsCache.data && (now - newsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        news: newsCache.data,
        cached: true,
        cachedAt: new Date(newsCache.timestamp).toISOString()
      })
    }

    // Tagesschau API aufrufen (using api2u endpoint which is more permissive)
    const response = await fetch('https://www.tagesschau.de/api2u/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'de-DE,de;q=0.9'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Tagesschau API nicht erreichbar')
    }

    const data = await response.json()
    
    // Nur die ersten 10 Artikel nehmen und relevante Daten extrahieren
    const news = data.news?.slice(0, 10).map((article: any) => ({
      id: article.sophoraId || article.externalId,
      title: article.title,
      shortText: article.firstSentence || article.teaserImage?.alttext,
      date: article.date,
      imageUrl: article.teaserImage?.imageVariants?.['16x9-256'] || article.teaserImage?.imageVariants?.['16x9-512'],
      tags: article.tags?.map((tag: any) => tag.tag) || [],
      detailsUrl: article.shareURL || article.detailsweb,
      type: article.type,
      topline: article.topline
    })) || []

    // Cache aktualisieren
    newsCache = {
      data: news,
      timestamp: now
    }

    return NextResponse.json({
      news,
      cached: false,
      fetchedAt: new Date(now).toISOString()
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    
    // Bei Fehler: Wenn Cache vorhanden, verwenden (auch wenn abgelaufen)
    if (newsCache.data) {
      return NextResponse.json({
        news: newsCache.data,
        cached: true,
        error: 'API temporarily unavailable, showing cached data',
        cachedAt: new Date(newsCache.timestamp).toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Nachrichten konnten nicht geladen werden' },
      { status: 500 }
    )
  }
}
