// Initialize ZAI SDK configuration from environment variables on Vercel
// The z-ai-web-dev-sdk requires a .z-ai-config file, but on Vercel we use env vars instead

import fs from 'fs';
import path from 'path';
import os from 'os';

let initialized = false;

export async function ensureZAIConfig(): Promise<void> {
  if (initialized) return;

  const baseUrl = process.env.ZAI_BASE_URL;
  const apiKey = process.env.ZAI_API_KEY;
  const token = process.env.ZAI_TOKEN;
  const userId = process.env.ZAI_USER_ID;
  const chatId = process.env.ZAI_CHAT_ID;

  if (!baseUrl || !apiKey) {
    // No env vars — try the default config file locations
    return;
  }

  // Check if config already exists
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(os.homedir(), '.z-ai-config'),
  ];

  for (const configPath of configPaths) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      if (config.baseUrl && config.apiKey) {
        initialized = true;
        return; // Config already exists and is valid
      }
    } catch {
      // File doesn't exist or is invalid, continue
    }
  }

  // Write config file to the current working directory (for Vercel serverless)
  const configPath = path.join(process.cwd(), '.z-ai-config');
  const config = {
    baseUrl,
    apiKey,
    ...(chatId && { chatId }),
    ...(token && { token }),
    ...(userId && { userId }),
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    // If writing fails (read-only filesystem), try /tmp
    try {
      const tmpPath = '/tmp/.z-ai-config';
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e2) {
      console.error('Failed to write ZAI config:', e2);
    }
  }

  initialized = true;
}
