export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorized, serverError, toNumber } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Usage stats
    const aiUsageCount = await prisma.aIUsageTracking.count({
      where: { tenantId, createdAt: { gte: subscription?.currentPeriodStart ?? new Date() } },
    });

    const productCount = await prisma.product.count({
      where: { tenantId, deletedAt: null },
    });

    return NextResponse.json({
      subscription: subscription ? {
        ...subscription,
        priceAmount: toNumber(subscription?.priceAmount),
      } : null,
      plans: (plans ?? []).map((p: any) => ({
        ...p,
        priceNgnMonthly: toNumber(p?.priceNgnMonthly),
        priceNgnYearly: toNumber(p?.priceNgnYearly),
        priceUsdMonthly: toNumber(p?.priceUsdMonthly),
        priceUsdYearly: toNumber(p?.priceUsdYearly),
      })),
      usage: {
        aiConversations: aiUsageCount,
        products: productCount,
        maxAiConversations: subscription?.plan?.maxAiConversations ?? 0,
        maxProducts: subscription?.plan?.maxProducts ?? 0,
      },
    });
  } catch (error: any) {
    return serverError(error);
  }
}
