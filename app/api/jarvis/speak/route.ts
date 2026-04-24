import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

// George — warm, mature British male, closest to the German Iron Man JARVIS dub (Bodo Wolf).
// Override via API-Setting "JARVIS_ELEVENLABS_VOICE_ID".
const FALLBACK_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

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
    getApiSetting('JARVIS_ELEVENLABS_VOICE_ID'),
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
          text: text.trim().slice(0, 1500), // guard against runaway length (Briefing kann ~600-800 Zeichen sein)
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
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
