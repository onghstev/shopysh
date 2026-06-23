export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const newPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!newPlan || !newPlan.isActive) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    if (subscription.planId === planId) {
      return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { defaultCurrency: true } });
    const currency = tenant?.defaultCurrency ?? 'NGN';
    const price = currency === 'USD'
      ? (subscription.billingCycle === 'YEARLY' ? newPlan.priceUsdYearly : newPlan.priceUsdMonthly)
      : (subscription.billingCycle === 'YEARLY' ? newPlan.priceNgnYearly : newPlan.priceNgnMonthly);

    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: {
        planId,
        priceAmount: price,
        currency,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    return NextResponse.json({ subscription: updated, message: `Switched to ${newPlan.name} plan` });
  } catch (error: any) {
    return serverError(error);
  }
}
