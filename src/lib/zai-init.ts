// Initialize ZAI SDK using environment variables (for Vercel) or config file (for local)
// On Vercel, the filesystem is read-only so we pass config directly to the constructor

interface ZAIConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  token?: string;
  userId?: string;
}

/**
 * Get ZAI configuration from environment variables.
 * Returns null if env vars are not set (will fall back to config file).
 */
export function getZAIConfigFromEnv(): ZAIConfig | null {
  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    chatId: process.env.ZAI_CHAT_ID,
    token: process.env.ZAI_TOKEN,
    userId: process.env.ZAI_USER_ID,
  };
}
