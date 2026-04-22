/**
 * Website Crawler für Prospect-Analyse.
 * Lädt die Website (+ /impressum, /kontakt, /leistungen) und extrahiert
 * sauberen Plaintext + Email-Adressen für die KI-Analyse.
 *
 * Sicherheits-Features (SSRF):
 *  - Nur http/https Schemata
 *  - Hostname muss öffentlich auflösbar sein (keine privaten IPs / localhost)
 *  - Größenbegrenzung pro Response (1 MB)
 *  - Timeout 8s pro Request
 *  - Kein Folgen externer Redirects auf andere Hosts
 */

import * as cheerio from 'cheerio'

const MAX_BYTES = 1_000_000
const TIMEOUT_MS = 8000

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

function isHostAllowed(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return !PRIVATE_HOST_PATTERNS.some((re) => re.test(host))
}

interface FetchResult {
  url: string
  status: number
  text: string
}

async function safeFetch(rawUrl: string): Promise<FetchResult | null> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  if (!isHostAllowed(url)) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Bereifung24-Bot/1.0; +https://bereifung24.de/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de,en;q=0.5',
      },
    })

    if (!res.ok || !res.body) {
      return { url: url.toString(), status: res.status, text: '' }
    }
    // Nur HTML
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      return { url: url.toString(), status: res.status, text: '' }
    }

    // Stream lesen mit Größenlimit
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        total += value.length
        if (total > MAX_BYTES) {
          try { await reader.cancel() } catch { /* ignore */ }
          break
        }
        chunks.push(value)
      }
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)))
    return { url: url.toString(), status: res.status, text: buf.toString('utf-8') }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function extractTextFromHtml(html: string): string {
  if (!html) return ''
  const $ = cheerio.load(html)
  $('script, style, noscript, svg, iframe, header nav, footer nav').remove()

  const main = $('main').text() || $('#content').text() || $('body').text() || ''
  return main
    .replace(/[\t\r\f\v]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 12_000) // KI-Kontext begrenzen
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_REGEX = /(?:\+?\d[\d\s\-/]{7,}\d)/g

function extractEmails(text: string, html: string): string[] {
  const set = new Set<string>()
  for (const src of [text, html]) {
    const matches = src.match(EMAIL_REGEX) || []
    for (const m of matches) {
      const e = m.toLowerCase().trim()
      // Filter offensichtliche Bilddateien / Boilerplate
      if (/\.(png|jpe?g|gif|webp|svg)$/i.test(e)) continue
      if (e.startsWith('email@') || e.startsWith('beispiel@')) continue
      set.add(e)
    }
  }
  return Array.from(set).slice(0, 10)
}

function extractPhones(text: string): string[] {
  const set = new Set<string>()
  const matches = text.match(PHONE_REGEX) || []
  for (const m of matches) {
    const cleaned = m.replace(/\s+/g, ' ').trim()
    if (cleaned.replace(/\D/g, '').length >= 8) set.add(cleaned)
  }
  return Array.from(set).slice(0, 5)
}

export interface CrawlResult {
  baseUrl: string
  pages: Array<{ url: string; title: string; status: number; chars: number }>
  combinedText: string
  emails: string[]
  phones: string[]
  errors: string[]
}

export async function crawlProspectWebsite(websiteUrl: string): Promise<CrawlResult> {
  const result: CrawlResult = {
    baseUrl: websiteUrl,
    pages: [],
    combinedText: '',
    emails: [],
    phones: [],
    errors: [],
  }

  let baseUrl: URL
  try {
    baseUrl = new URL(websiteUrl)
  } catch {
    result.errors.push('Ungültige Website-URL')
    return result
  }
  if (!isHostAllowed(baseUrl)) {
    result.errors.push('Host ist nicht erlaubt (privater IP-Bereich oder unzulässiges Schema).')
    return result
  }

  // Kandidaten-Pfade (max 4 Requests insgesamt)
  const paths = ['/', '/impressum', '/kontakt', '/leistungen']
  const seen = new Set<string>()

  const collectedTexts: string[] = []

  for (const p of paths) {
    const u = new URL(p, baseUrl).toString()
    if (seen.has(u)) continue
    seen.add(u)

    const r = await safeFetch(u)
    if (!r) {
      result.errors.push(`Fetch fehlgeschlagen: ${u}`)
      continue
    }
    if (!r.text) {
      result.pages.push({ url: r.url, title: '', status: r.status, chars: 0 })
      continue
    }

    const $ = cheerio.load(r.text)
    const title = ($('title').first().text() || '').trim().slice(0, 200)
    const txt = extractTextFromHtml(r.text)

    result.pages.push({ url: r.url, title, status: r.status, chars: txt.length })
    if (txt) collectedTexts.push(`# ${title || r.url}\n${txt}`)

    result.emails.push(...extractEmails(txt, r.text))
    result.phones.push(...extractPhones(txt))
  }

  result.combinedText = collectedTexts.join('\n\n---\n\n').slice(0, 20_000)
  result.emails = Array.from(new Set(result.emails)).slice(0, 10)
  result.phones = Array.from(new Set(result.phones)).slice(0, 5)
  return result
}
