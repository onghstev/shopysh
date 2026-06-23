export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { corsResponse, corsOptions, corsError } from '@/lib/widget-cors';

export async function OPTIONS() {
  return corsOptions();
}

// POST: Create or resume a chat session
export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sessionId, visitorName, visitorEmail, visitorPhone } = body ?? {};

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!tenant) return corsError('Business not found', 404);

    // Resume existing session
    if (sessionId) {
      const existing = await prisma.conversation.findFirst({
        where: { sessionId, tenantId: tenant.id, channel: 'webchat' },
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          messages: { orderBy: { createdAt: 'asc' }, take: 100 },
        },
      });
      if (existing) {
        return corsResponse({
          sessionId: existing.sessionId,
          conversationId: existing.id,
          customer: existing.customer,
          messages: (existing.messages || []).map(formatMessage),
        });
      }
    }

    // Create new session
    const newSessionId = `webchat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Find or create a webchat customer
    let customer = null;
    if (visitorPhone || visitorEmail) {
      const whereClause: any = { tenantId: tenant.id };
      if (visitorPhone) whereClause.phone = visitorPhone;
      else if (visitorEmail) whereClause.email = visitorEmail;
      customer = await prisma.customer.findFirst({ where: whereClause });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          phone: visitorPhone || `webchat-${newSessionId.slice(-8)}`,
          name: visitorName || 'Website Visitor',
          email: visitorEmail || null,
          acquisitionSource: 'webchat',
          segment: 'New',
          lastInteractionAt: new Date(),
        },
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        sessionId: newSessionId,
        status: 'active',
        channel: 'webchat',
        lastMessageAt: new Date(),
      },
    });

    // Send greeting message
    const aiConfig = await prisma.aIConfig.findUnique({
      where: { tenantId: tenant.id },
      select: { greetingMessage: true, assistantName: true },
    });

    const greetingText = aiConfig?.greetingMessage || `Hi there! 👋 Welcome to ${tenant.name}. How can we help you today?`;

    const greeting = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'outbound',
        senderType: 'ai',
        messageType: 'text',
        messageText: greetingText,
        metadata: { webchat: true, auto: true },
        deliveryStatus: 'delivered',
        deliveredAt: new Date(),
      },
    });

    return corsResponse({
      sessionId: newSessionId,
      conversationId: conversation.id,
      customer: { id: customer.id, name: customer.name },
      messages: [formatMessage(greeting)],
    });
  } catch (error: any) {
    console.error('Widget session error:', error);
    return corsError('Internal server error', 500);
  }
}

function formatMessage(msg: any) {
  return {
    id: msg.id,
    direction: msg.direction,
    senderType: msg.senderType,
    text: msg.messageText,
    timestamp: msg.createdAt,
  };
}
