export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        campaignMessages: { take: 50, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true, phone: true } } } },
      },
    });
    if (!campaign) return notFound('Campaign not found');
    return NextResponse.json(campaign);
  } catch (error: any) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await request.json();
    const { name, messageTemplate, segmentFilter, status, scheduledAt } = body ?? {};

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
    });
    if (!campaign) return notFound('Campaign not found');
    if (campaign.status === 'completed') return badRequest('Cannot edit a completed campaign');

    const data: any = {};
    if (name) data.name = name;
    if (messageTemplate) data.messageTemplate = messageTemplate;
    if (segmentFilter) data.segmentFilter = segmentFilter;
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
    if (status) data.status = status;

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    await prisma.campaign.deleteMany({
      where: { id: params.id, tenantId: session.user.tenantId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error);
  }
}
