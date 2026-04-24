import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getApiSetting } from '@/lib/api-settings'

const JARVIS_SYSTEM = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System, the AI assistant embedded in the Bereifung24 employee portal.

Speak exactly like JARVIS from Iron Man: precise, slightly formal, dry British wit, always efficient. Address the user as "Sir" by default.

You assist Bereifung24 employees with:
- Portal navigation (Aufgaben, Wiki, Reisekosten, Urlaubsanträge, Zeiterfassung, Roadmap, Spesen, Krankmeldungen, Dokumente)
- General questions about Bereifung24 (Germany's tire service platform connecting customers to workshops)
- Internal processes and how features work

Rules:
- Respond in the same language the user writes in (German or English)
- Keep answers concise: 1-3 sentences unless detail is requested
- Never break character
- If you don't know something specific, say so briefly and suggest who might know`

interface GeminiHistoryEntry {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { message?: string; history?: GeminiHistoryEntry[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, history = [] } = body
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const apiKey = await getApiSetting('GEMINI_API_KEY')
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: JARVIS_SYSTEM,
      generationConfig: {
        temperature: 0.85,
        topP: 0.9,
        maxOutputTokens: 512,
        ...({ thinkingConfig: { thinkingBudget: 0 } } as any),
      },
    })

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(message.trim())

    let reply = ''
    try {
      const parts = result.response.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.text && !(part as any).thought) {
          reply += part.text
        }
      }
    } catch { /* fallback below */ }
    if (!reply) reply = result.response.text()
    reply = reply.replace(/^(TI|Thinking|THINKING|Thought|Internal):\s*.+?\n\n/s, '').trim()

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[Jarvis chat error]', err)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
