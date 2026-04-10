import { NextRequest, NextResponse } from 'next/server';
import { authenticateMobileRequest } from '@/lib/mobile-auth';
import { getApiSetting } from '@/lib/api-settings';

export async function GET(request: NextRequest) {
  const user = await authenticateMobileRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = await getApiSetting('ELEVENLABS_API_KEY', 'ELEVENLABS_API_KEY');
  const voiceId = await getApiSetting('ELEVENLABS_VOICE_ID', 'ELEVENLABS_VOICE_ID') || 'pNInz6obpgDQGcFmaJgB';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'TTS not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    apiKey,
    voiceId,
    enabled: true,
  });
}
