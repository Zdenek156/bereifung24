import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

const FALLBACK_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9' // Daniel — closest to JARVIS tone

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text } = body
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 })
  }

  const [apiKey, voiceId] = await Promise.all([
    getApiSetting('ELEVENLABS_API_KEY'),
    getApiSetting('ELEVENLABS_VOICE_ID'),
  ])

  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 })
  }

  const resolvedVoiceId = voiceId || FALLBACK_VOICE_ID

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.trim().slice(0, 500), // guard against runaway length
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.8,
            style: 0.2,
          },
        }),
      }
    )

    if (!elevenRes.ok) {
      const errText = await elevenRes.text()
      console.error('[Jarvis speak error]', elevenRes.status, errText)
      return NextResponse.json({ error: 'ElevenLabs request failed' }, { status: 502 })
    }

    const audioBuffer = await elevenRes.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[Jarvis speak error]', err)
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 })
  }
}
