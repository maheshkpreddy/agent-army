import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.ZAI_BASE_URL;
    const apiKey = process.env.ZAI_API_KEY;
    const token = process.env.ZAI_TOKEN;
    const chatId = process.env.ZAI_CHAT_ID;
    const userId = process.env.ZAI_USER_ID;

    const url = `${baseUrl}/chat/completions`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Z-AI-From': 'Z',
    };
    if (chatId) headers['X-Chat-Id'] = chatId;
    if (userId) headers['X-User-Id'] = userId;
    if (token) headers['X-Token'] = token;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          { role: 'assistant', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hi in 3 words' }
        ],
        thinking: { type: 'disabled' },
      }),
    });

    const text = await response.text();
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      body: text.substring(0, 500),
      url: url,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      cause: error.cause?.message || 'unknown',
      code: error.cause?.code || 'unknown',
    });
  }
}
