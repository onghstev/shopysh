export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceNgnMonthly: true,
        priceNgnYearly: true,
        priceUsdMonthly: true,
        priceUsdYearly: true,
        features: true,
        maxAiConversations: true,
        maxProducts: true,
        maxUsers: true,
        maxStorageMb: true,
        maxBroadcastsMonthly: true,
        apiAccess: true,
        customAiTraining: true,
        prioritySupport: true,
      },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 });
  }
}
