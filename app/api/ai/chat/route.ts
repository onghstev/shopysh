export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { message, conversationId, customerId } = body ?? {};

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // Load business context
    const [tenant, products, aiConfig] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.product.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        select: { name: true, price: true, currency: true, stockQuantity: true, description: true },
        take: 50,
      }),
      prisma.aIConfig.findUnique({ where: { tenantId } }),
    ]);

    const productCatalog = (products ?? []).map((p: any) => 
      `- ${p?.name}: ${p?.currency} ${Number(p?.price)?.toLocaleString?.()} (${(p?.stockQuantity ?? 0) > 0 ? 'In stock' : 'Out of stock'})`
    ).join('\n');

    const systemPrompt = `You are ${aiConfig?.assistantName ?? 'AI Assistant'} for ${tenant?.name ?? 'a business'}.
Tone: ${aiConfig?.responseTone ?? 'friendly'}
You help customers with product inquiries, order placement, and general questions.
You understand Nigerian English and Pidgin.

Product Catalog:
${productCatalog}

Currency: ${tenant?.defaultCurrency ?? 'NGN'}
Business Hours: 8am - 6pm WAT

Instructions:
- Be helpful, concise, and professional
- Recommend products when appropriate
- Help with order inquiries
- If unsure, offer to connect with a human agent
- Use Nigerian English when the customer does
${aiConfig?.greetingMessage ? `Greeting: ${aiConfig.greetingMessage}` : ''}`;

    // Stream from LLM API (supports DeepSeek, OpenAI, or any compatible provider)
    const { chatCompletion } = await import('@/lib/llm');
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: true,
      maxTokens: 1000,
    });

    if (!response?.ok) {
      const errText = await response?.text?.() ?? 'LLM API request failed';
      return new Response(JSON.stringify({ error: errText }), { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let fullResponse = '';
        try {
          while (true) {
            const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
            if (done) break;
            const chunk = decoder.decode(value);
            controller.enqueue(encoder.encode(chunk));

            // Parse to collect full response
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line?.startsWith?.('data: ') && line !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  fullResponse += parsed?.choices?.[0]?.delta?.content ?? '';
                } catch { /* skip */ }
              }
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
          // Save to DB asynchronously
          if (conversationId && fullResponse) {
            const { getLLMConfig } = await import('@/lib/llm');
            const { model } = await getLLMConfig();
            prisma.message.create({
              data: {
                conversationId,
                direction: 'outbound',
                senderType: 'ai',
                messageType: 'text',
                messageText: fullResponse,
                aiModel: model,
              },
            }).catch((e: any) => console.error('Failed to save AI message:', e));
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'AI processing failed' }), { status: 500 });
  }
}
