export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');

    const where: any = { tenantId };
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: { createdBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({ campaigns, total, page, limit });
  } catch (error: any) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId || !session?.user?.id) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await request.json();
    const { name, messageTemplate, segmentFilter, scheduledAt, channel } = body ?? {};

    if (!name || !messageTemplate) return badRequest('Name and message template are required');

    // Count target customers based on segment filter
    const customerWhere: any = { tenantId, deletedAt: null, isBlocked: false };
    if (segmentFilter?.segment) customerWhere.segment = segmentFilter.segment;
    const targetCount = await prisma.customer.count({ where: customerWhere });

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name,
        messageTemplate,
        segmentFilter: { ...(segmentFilter ?? {}), channel: channel || 'both' },
        targetCustomerCount: targetCount,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdByUserId: session.user.id,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    return serverError(error);
  }
}
