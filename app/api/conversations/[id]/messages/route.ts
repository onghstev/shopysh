export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();

    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) return notFound('Conversation not found');

    return NextResponse.json({ conversation });
  } catch (error: any) {
    return serverError(error);
  }
}
