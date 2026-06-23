export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const customerId = params.id;

    // Fetch orders, conversations, and tags as timeline events
    const [orders, conversations, tags] = await Promise.all([
      prisma.order.findMany({
        where: { customerId, tenantId },
        select: { id: true, orderNumber: true, status: true, totalAmount: true, currency: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.conversation.findMany({
        where: { customerId, tenantId },
        select: { id: true, status: true, channel: true, intent: true, sentiment: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.customerTag.findMany({
        where: { customerId, tenantId },
        select: { id: true, tag: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const timeline = [
      ...orders.map((o: any) => ({
        type: 'order' as const,
        id: o.id,
        title: `Order ${o.orderNumber}`,
        description: `Status: ${o.status} | Total: ${o.currency} ${o.totalAmount}`,
        date: o.createdAt,
      })),
      ...conversations.map((c: any) => ({
        type: 'conversation' as const,
        id: c.id,
        title: `${c.channel} Conversation`,
        description: `${c.intent ?? 'General inquiry'} | Sentiment: ${c.sentiment ?? 'Neutral'}`,
        date: c.createdAt,
      })),
      ...tags.map((t: any) => ({
        type: 'tag' as const,
        id: t.id,
        title: `Tagged: ${t.tag}`,
        description: '',
        date: t.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(timeline);
  } catch (error: any) {
    return serverError(error);
  }
}
