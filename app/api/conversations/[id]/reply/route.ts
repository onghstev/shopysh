export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, badRequest, serverError } from '@/lib/api-helpers';

// POST: Business owner/agent replies to a conversation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const body = await req.json();
    const { messageText } = body ?? {};

    if (!messageText?.trim()) return badRequest('messageText is required');

    // Verify conversation belongs to this tenant
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
    });
    if (!conversation) return notFound('Conversation not found');

    // Create the reply message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'outbound',
        senderType: 'agent',
        senderUserId: session.user.id,
        messageType: 'text',
        messageText: messageText.trim(),
        metadata: { sentBy: session.user.name || session.user.email, channel: conversation.channel },
        deliveryStatus: 'delivered',
        deliveredAt: new Date(),
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return serverError(error);
  }
}
