import { NextResponse } from 'next/server';
import { getZAIConfigFromEnv } from '@/lib/zai-init';

export async function GET() {
  try {
    const envConfig = getZAIConfigFromEnv();
    if (!envConfig) {
      return NextResponse.json({ error: 'No env config', envVars: {
        ZAI_BASE_URL: !!process.env.ZAI_BASE_URL,
        ZAI_API_KEY: !!process.env.ZAI_API_KEY,
      }});
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = new ZAI(envConfig);
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in 5 words' }
      ],
      stream: false,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices?.[0]?.message?.content;
    return NextResponse.json({ 
      success: true, 
      response,
      configFound: true,
      baseUrl: envConfig.baseUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    });
  }
}
