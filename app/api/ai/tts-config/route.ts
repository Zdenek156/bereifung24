import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth/mobile-auth';
import { getApiSetting } from '@/lib/api-settings';

export async function GET(request: NextRequest) {
  const authResult = await verifyMobileToken(request);
  if (!authResult.success) {
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
