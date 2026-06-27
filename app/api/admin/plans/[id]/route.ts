export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } });
  if (user?.role !== 'SUPER_ADMIN') return null;
  return session;
}

// PATCH update plan
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await request.json();

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // If name is being changed, check for uniqueness
    if (body.name && body.name !== plan.name) {
      const existing = await prisma.subscriptionPlan.findUnique({ where: { name: body.name } });
      if (existing) return NextResponse.json({ error: 'A plan with this name already exists' }, { status: 409 });
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.description != null && { description: body.description }),
        ...(body.priceNgnMonthly != null && { priceNgnMonthly: body.priceNgnMonthly }),
        ...(body.priceNgnYearly != null && { priceNgnYearly: body.priceNgnYearly }),
        ...(body.priceUsdMonthly != null && { priceUsdMonthly: body.priceUsdMonthly }),
        ...(body.priceUsdYearly != null && { priceUsdYearly: body.priceUsdYearly }),
        ...(body.features != null && { features: body.features }),
        ...(body.maxAiConversations != null && { maxAiConversations: body.maxAiConversations }),
        ...(body.maxProducts != null && { maxProducts: body.maxProducts }),
        ...(body.maxUsers != null && { maxUsers: body.maxUsers }),
        ...(body.maxStorageMb != null && { maxStorageMb: body.maxStorageMb }),
        ...(body.maxBroadcastsMonthly != null && { maxBroadcastsMonthly: body.maxBroadcastsMonthly }),
        ...(body.apiAccess != null && { apiAccess: body.apiAccess }),
        ...(body.customAiTraining != null && { customAiTraining: body.customAiTraining }),
        ...(body.prioritySupport != null && { prioritySupport: body.prioritySupport }),
        ...(body.displayOrder != null && { displayOrder: body.displayOrder }),
        ...(body.isActive != null && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error: any) {
    console.error('Admin plan update error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE plan (soft: deactivate)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    if (plan._count.subscriptions > 0) {
      // Soft-delete: deactivate
      await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ message: 'Plan deactivated (has active subscriptions)' });
    } else {
      await prisma.subscriptionPlan.delete({ where: { id } });
      return NextResponse.json({ message: 'Plan deleted' });
    }
  } catch (error: any) {
    console.error('Admin plan delete error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete plan' }, { status: 500 });
  }
}
