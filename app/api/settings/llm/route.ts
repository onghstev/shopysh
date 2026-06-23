export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { clearLLMConfigCache } from '@/lib/llm';

// Only SUPER_ADMIN can view/edit LLM provider settings
function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    if (session.user.role !== 'SUPER_ADMIN') return forbidden();

    const config = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
      select: { settings: true },
    });

    const settings = (config?.settings as any) ?? {};
    const llm = settings?.llm ?? {};

    return NextResponse.json({
      provider: llm.provider || 'auto',
      apiKey: llm.apiKey ? maskKey(llm.apiKey) : '',
      baseUrl: llm.baseUrl || '',
      model: llm.model || '',
      hasKey: !!llm.apiKey,
    });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    if (session.user.role !== 'SUPER_ADMIN') return forbidden();

    const body = await request.json();
    const { provider, apiKey, baseUrl, model } = body;

    // Read existing settings
    const existing = await prisma.aIConfig.findUnique({
      where: { tenantId: session.user.tenantId },
      select: { settings: true },
    });

    const currentSettings = (existing?.settings as any) ?? {};
    const currentLlm = currentSettings?.llm ?? {};

    // Build updated LLM config
    const updatedLlm: any = { ...currentLlm };

    if (provider !== undefined) updatedLlm.provider = provider;
    if (baseUrl !== undefined) updatedLlm.baseUrl = baseUrl;
    if (model !== undefined) updatedLlm.model = model;

    // Only update API key if a real value is provided (not masked)
    if (apiKey !== undefined && apiKey !== '' && !apiKey.includes('••••')) {
      updatedLlm.apiKey = apiKey;
    }

    // If provider is 'auto' (platform default), clear custom settings
    if (provider === 'auto') {
      updatedLlm.apiKey = '';
      updatedLlm.baseUrl = '';
      updatedLlm.model = '';
    }

    const updatedSettings = { ...currentSettings, llm: updatedLlm };

    await prisma.aIConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: { settings: updatedSettings },
      create: { tenantId: session.user.tenantId, settings: updatedSettings },
    });

    // Clear LLM config cache so new settings take effect immediately
    clearLLMConfigCache();

    // Validate the key works by making a test request
    if (updatedLlm.apiKey && provider !== 'auto') {
      try {
        const testUrl = updatedLlm.baseUrl || getDefaultBaseUrl(provider);
        const testModel = updatedLlm.model || getDefaultModel(provider);
        const testRes = await fetch(`${testUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${updatedLlm.apiKey}`,
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
            max_tokens: 5,
          }),
        });

        if (!testRes.ok) {
          const errText = await testRes.text().catch(() => '');
          return NextResponse.json({
            success: true,
            warning: `Settings saved, but API key validation failed (${testRes.status}). Please check your key. ${errText.slice(0, 200)}`,
          });
        }
      } catch (e: any) {
        return NextResponse.json({
          success: true,
          warning: `Settings saved, but could not reach the API endpoint. Error: ${e.message?.slice(0, 200)}`,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case 'deepseek': return 'https://api.deepseek.com/v1';
    case 'openai': return 'https://api.openai.com/v1';
    case 'groq': return 'https://api.groq.com/openai/v1';
    default: return 'https://api.deepseek.com/v1';
  }
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'deepseek': return 'deepseek-chat';
    case 'openai': return 'gpt-4o-mini';
    case 'groq': return 'llama-3.1-70b-versatile';
    default: return 'deepseek-chat';
  }
}
