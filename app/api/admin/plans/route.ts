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

// GET all plans
export async function GET() {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Admin plans fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST create new plan
export async function POST(request: NextRequest) {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      name, description, priceNgnMonthly, priceNgnYearly, priceUsdMonthly, priceUsdYearly,
      features, maxAiConversations, maxProducts, maxUsers, maxStorageMb,
      maxBroadcastsMonthly, apiAccess, customAiTraining, prioritySupport, displayOrder, isActive,
    } = body;

    if (!name || priceNgnMonthly == null || priceUsdMonthly == null) {
      return NextResponse.json({ error: 'Name and prices are required' }, { status: 400 });
    }

    const existing = await prisma.subscriptionPlan.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'A plan with this name already exists' }, { status: 409 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description: description || null,
        priceNgnMonthly: priceNgnMonthly || 0,
        priceNgnYearly: priceNgnYearly || 0,
        priceUsdMonthly: priceUsdMonthly || 0,
        priceUsdYearly: priceUsdYearly || 0,
        features: features || {},
        maxAiConversations: maxAiConversations ?? 1000,
        maxProducts: maxProducts ?? 30,
        maxUsers: maxUsers ?? 1,
        maxStorageMb: maxStorageMb ?? 1,
        maxBroadcastsMonthly: maxBroadcastsMonthly ?? 0,
        apiAccess: apiAccess ?? false,
        customAiTraining: customAiTraining ?? false,
        prioritySupport: prioritySupport ?? false,
        displayOrder: displayOrder ?? 99,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    console.error('Admin plan create error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to create plan' }, { status: 500 });
  }
}
