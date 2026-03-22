import { NextRequest, NextResponse } from 'next/server'
import { sendSupportChatMessage, type SupportChatMessage } from '@/lib/ai/supportChatService'

export async function POST(request: NextRequest) {
  let body: { message?: string; chatHistory?: SupportChatMessage[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, chatHistory } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const sanitizedMessage = message.trim().slice(0, 300)

  try {
    const { response, updatedHistory } = await sendSupportChatMessage(
      sanitizedMessage,
      chatHistory || [],
    )

    return NextResponse.json({ response, chatHistory: updatedHistory })
  } catch (error: any) {
    console.error('Support Chat Error:', error?.message || error)
    return NextResponse.json({
      response: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte nutzen Sie das Kontaktformular unten.',
      chatHistory: chatHistory || [],
    })
  }
}
