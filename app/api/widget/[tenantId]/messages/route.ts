export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { corsResponse, corsOptions, corsError } from '@/lib/widget-cors';

export async function OPTIONS() {
  return corsOptions();
}

// GET: Poll for new messages
export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const after = searchParams.get('after'); // ISO timestamp

    if (!sessionId) return corsError('sessionId is required');

    const conversation = await prisma.conversation.findFirst({
      where: { sessionId, tenantId: params.tenantId, channel: 'webchat' },
      select: { id: true },
    });
    if (!conversation) return corsError('Session not found', 404);

    const whereClause: any = { conversationId: conversation.id };
    if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return corsResponse({
      messages: messages.map((msg: any) => ({
        id: msg.id,
        direction: msg.direction,
        senderType: msg.senderType,
        text: msg.messageText,
        timestamp: msg.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Widget messages GET error:', error);
    return corsError('Internal server error', 500);
  }
}

// POST: Customer sends a message
export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const body = await req.json();
    const { sessionId, text } = body ?? {};

    if (!sessionId || !text?.trim()) {
      return corsError('sessionId and text are required');
    }

    const conversation = await prisma.conversation.findFirst({
      where: { sessionId, tenantId: params.tenantId, channel: 'webchat' },
      include: { customer: { select: { id: true, name: true } } },
    });
    if (!conversation) return corsError('Session not found', 404);

    // Save customer message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        senderType: 'customer',
        messageType: 'text',
        messageText: text.trim(),
        metadata: { webchat: true },
        deliveryStatus: 'delivered',
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    await prisma.customer.update({
      where: { id: conversation.customerId },
      data: { lastInteractionAt: new Date() },
    });

    // Generate AI auto-reply
    let aiReply = null;
    const aiConfig = await prisma.aIConfig.findUnique({ where: { tenantId: params.tenantId } });

    if (aiConfig?.autoReplyEnabled) {
      try {
        aiReply = await generateAIReply(params.tenantId, conversation.id, text.trim(), conversation.customer?.name || 'Customer');
      } catch (e: any) {
        console.error('AI reply error:', e);
        // Fallback to rule-based reply
        const fallbackText = aiConfig?.fallbackMessage || "Thank you for your message! Our team will get back to you shortly.";
        aiReply = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'outbound',
            senderType: 'ai',
            messageType: 'text',
            messageText: fallbackText,
            metadata: { webchat: true, fallback: true },
            deliveryStatus: 'delivered',
            deliveredAt: new Date(),
          },
        });
      }
    }

    return corsResponse({
      message: {
        id: message.id,
        direction: 'inbound',
        senderType: 'customer',
        text: text.trim(),
        timestamp: message.createdAt,
      },
      aiReply: aiReply ? {
        id: aiReply.id,
        direction: 'outbound',
        senderType: 'ai',
        text: aiReply.messageText,
        timestamp: aiReply.createdAt,
      } : null,
    });
  } catch (error: any) {
    console.error('Widget message POST error:', error);
    return corsError('Internal server error', 500);
  }
}

async function generateAIReply(tenantId: string, conversationId: string, customerMessage: string, customerName: string) {
  // Load business context
  const [tenant, products, aiConfig, recentMessages] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, defaultCurrency: true } }),
    prisma.product.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { name: true, price: true, currency: true, stockQuantity: true, description: true },
      take: 30,
    }),
    prisma.aIConfig.findUnique({ where: { tenantId } }),
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { direction: true, senderType: true, messageText: true },
    }),
  ]);

  const productCatalog = (products ?? []).map((p: any) =>
    `- ${p.name}: ${p.currency} ${Number(p.price)?.toLocaleString()} (${(p.stockQuantity ?? 0) > 0 ? 'In stock' : 'Out of stock'})${p.description ? ' — ' + p.description.slice(0, 80) : ''}`
  ).join('\n');

  const chatHistory = (recentMessages ?? []).reverse().map((m: any) =>
    `${m.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${m.messageText}`
  ).join('\n');

  const systemPrompt = `You are ${aiConfig?.assistantName ?? 'Chat Assistant'} for ${tenant?.name ?? 'a business'}.
Tone: ${aiConfig?.responseTone ?? 'friendly and professional'}
${aiConfig?.assistantPersonality ? `Personality: ${aiConfig.assistantPersonality}` : ''}

You are chatting with ${customerName} via the business website chat widget.
Help them with product inquiries, orders, and general questions.
Be concise, helpful, and warm. Keep responses under 150 words.
Use Nigerian English/Pidgin if the customer does.

Product Catalog:
${productCatalog || 'No products listed yet.'}

Currency: ${tenant?.defaultCurrency ?? 'NGN'}

Recent conversation:
${chatHistory}`;

  const { chatCompletion } = await import('@/lib/llm');

  const response = await chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: customerMessage },
    ],
    stream: false,
    maxTokens: 500,
    temperature: 0.7,
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const replyText = data?.choices?.[0]?.message?.content?.trim();

  if (!replyText) throw new Error('Empty AI response');

  // Save AI reply
  const aiMessage = await prisma.message.create({
    data: {
      conversationId,
      direction: 'outbound',
      senderType: 'ai',
      messageType: 'text',
      messageText: replyText,
      aiModel: (await (await import('@/lib/llm')).getLLMConfig()).model,
      metadata: { webchat: true, aiGenerated: true },
      deliveryStatus: 'delivered',
      deliveredAt: new Date(),
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return aiMessage;
}
