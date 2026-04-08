import { NextRequest, NextResponse } from 'next/server';

// In-memory ring buffer for debug logs (last 500 entries)
// Persists as long as the PM2 process is running
const MAX_LOGS = 500;

interface DebugLogEntry {
  timestamp: string;
  device: string;
  platform: string;
  appVersion: string;
  level: string;
  tag: string;
  message: string;
  data?: Record<string, unknown>;
}

// Global store (survives across requests, cleared on PM2 restart)
const debugLogs: DebugLogEntry[] = (global as any).__debugLogs ?? [];
(global as any).__debugLogs = debugLogs;

// POST — App sends a debug log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device, platform, appVersion, level, tag, message, data } = body;

    if (!tag || !message) {
      return NextResponse.json({ error: 'tag and message required' }, { status: 400 });
    }

    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      device: device || 'unknown',
      platform: platform || 'unknown',
      appVersion: appVersion || 'unknown',
      level: level || 'info',
      tag: tag || 'general',
      message: String(message).substring(0, 2000),
      data: data || undefined,
    };

    debugLogs.push(entry);

    // Trim to max size
    while (debugLogs.length > MAX_LOGS) {
      debugLogs.shift();
    }

    // Also log to server console for PM2 logs
    console.log(`[MOBILE-DEBUG] [${entry.platform}] [${entry.tag}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Mobile debug log error:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET — Admin views logs (with optional tag filter)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), MAX_LOGS);
  const clear = searchParams.get('clear');

  if (clear === 'true') {
    debugLogs.length = 0;
    return NextResponse.json({ ok: true, message: 'Logs cleared' });
  }

  let filtered = tag
    ? debugLogs.filter((l) => l.tag === tag)
    : debugLogs;

  // Return newest first, limited
  const result = filtered.slice(-limit).reverse();

  return NextResponse.json({
    total: debugLogs.length,
    filtered: filtered.length,
    returned: result.length,
    logs: result,
  });
}
