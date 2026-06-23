/**
 * Centralized LLM configuration.
 * 
 * Priority order for API configuration:
 *   1. Database (AIConfig.settings.llm) — set via Settings > AI > LLM Provider
 *   2. Environment variables (LLM_API_KEY, LLM_BASE_URL, LLM_MODEL)
 *   3. Local LLM server (llama.cpp) at http://llm:8080/v1 (no API key needed)
 * 
 * Supports any OpenAI-compatible API (DeepSeek, OpenAI, Groq, local llama.cpp, etc.)
 */

import { prisma } from '@/lib/db';

interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// In-memory cache to avoid hitting DB on every request
let cachedConfig: LLMConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Get LLM config from the database (any AIConfig that has LLM settings).
 * Returns null if no DB config is found.
 */
async function getLLMConfigFromDB(): Promise<LLMConfig | null> {
  try {
    // Find any AIConfig that has LLM settings with an API key
    const configs = await prisma.aIConfig.findMany({
      where: { settings: { not: {} } },
      select: { settings: true },
      take: 10,
    });

    for (const config of configs) {
      const settings = config.settings as any;
      const llm = settings?.llm;
      if (llm?.apiKey && llm.provider !== 'auto') {
        const provider = llm.provider || 'deepseek';
        return {
          apiKey: llm.apiKey,
          baseUrl: llm.baseUrl || getDefaultBaseUrl(provider),
          model: llm.model || getDefaultModel(provider),
        };
      }
    }
    return null;
  } catch (e) {
    console.error('[LLM] Failed to read config from DB:', e);
    return null;
  }
}

function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case 'local': return 'http://llm:8080/v1';
    case 'deepseek': return 'https://api.deepseek.com/v1';
    case 'openai': return 'https://api.openai.com/v1';
    case 'groq': return 'https://api.groq.com/openai/v1';
    default: return 'http://llm:8080/v1';
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'local': return 'qwen2.5-3b-instruct';
    case 'deepseek': return 'deepseek-chat';
    case 'openai': return 'gpt-4o-mini';
    case 'groq': return 'llama-3.1-70b-versatile';
    default: return 'qwen2.5-3b-instruct';
  }
}

/**
 * Get LLM configuration with priority:
 *   1. Database settings (set via admin UI)
 *   2. Environment variables (LLM_API_KEY, LLM_BASE_URL, LLM_MODEL)

 */
export async function getLLMConfig(): Promise<LLMConfig> {
  // Check cache first
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConfig;
  }

  // 1. Try database
  const dbConfig = await getLLMConfigFromDB();
  if (dbConfig) {
    cachedConfig = dbConfig;
    cacheTimestamp = now;
    return dbConfig;
  }

  // 2. Try environment variables
  const envKey = process.env.LLM_API_KEY;
  const envBaseUrl = process.env.LLM_BASE_URL;
  if (envKey || envBaseUrl) {
    const config: LLMConfig = {
      apiKey: envKey || 'no-key-needed',
      baseUrl: envBaseUrl || 'http://llm:8080/v1',
      model: process.env.LLM_MODEL || 'qwen2.5-3b-instruct',
    };
    cachedConfig = config;
    cacheTimestamp = now;
    return config;
  }

  // 3. Default: local llama.cpp server (no API key needed)
  const localConfig: LLMConfig = {
    apiKey: 'no-key-needed',
    baseUrl: 'http://llm:8080/v1',
    model: 'qwen2.5-3b-instruct',
  };
  cachedConfig = localConfig;
  cacheTimestamp = now;
  return localConfig;
}

/**
 * Synchronous fallback for getLLMConfig (uses cache or env vars only).
 * Use this only when you can't await (e.g., in a synchronous context).
 */
export function getLLMConfigSync(): LLMConfig {
  // Return cache if fresh
  if (cachedConfig && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return cachedConfig;
  }

  // Env var fallback, then local LLM default
  const apiKey = process.env.LLM_API_KEY || 'no-key-needed';
  const baseUrl = process.env.LLM_BASE_URL || 'http://llm:8080/v1';
  const model = process.env.LLM_MODEL || 'qwen2.5-3b-instruct';

  return { apiKey, baseUrl, model };
}

/** Clear the config cache (call after settings are updated). */
export function clearLLMConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Make a chat completion request to the configured LLM provider.
 * Returns the raw fetch Response for streaming support.
 */
export async function chatCompletion(options: {
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}) {
  const { apiKey, baseUrl, model } = await getLLMConfig();
  const { messages, stream = true, maxTokens = 1000, temperature } = options;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      max_tokens: maxTokens,
      ...(temperature !== undefined ? { temperature } : {}),
    }),
  });

  return response;
}

/**
 * Make a non-streaming chat completion and return the text response.
 */
export async function chatCompletionText(options: {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const response = await chatCompletion({ ...options, stream: false });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'LLM API request failed');
    throw new Error(`LLM API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}
