export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    // RFM Segmentation: Recency, Frequency, Monetary
    const customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true, name: true, phone: true, email: true, segment: true,
        totalOrders: true, lifetimeValue: true, lastOrderAt: true,
        lastInteractionAt: true, createdAt: true,
      },
    });

    const now = new Date();
    const segments: Record<string, any[]> = { VIP: [], Active: [], AtRisk: [], New: [], Dormant: [] };

    for (const c of customers) {
      const daysSinceOrder = c.lastOrderAt ? Math.floor((now.getTime() - new Date(c.lastOrderAt).getTime()) / 86400000) : 999;
      const ltv = Number(c.lifetimeValue ?? 0);
      const orders = c.totalOrders ?? 0;

      let seg = 'New';
      if (orders >= 5 && ltv >= 500000) seg = 'VIP';
      else if (orders >= 2 && daysSinceOrder <= 30) seg = 'Active';
      else if (orders >= 2 && daysSinceOrder > 60) seg = 'AtRisk';
      else if (orders === 0 && daysSinceOrder > 90) seg = 'Dormant';
      else if (orders <= 1) seg = 'New';

      segments[seg].push({ ...c, computedSegment: seg, daysSinceOrder });
    }

    const summary = Object.entries(segments).map(([name, custs]) => ({
      name,
      count: custs.length,
      totalRevenue: custs.reduce((sum: number, c: any) => sum + Number(c.lifetimeValue ?? 0), 0),
      avgOrderValue: custs.length > 0 ? custs.reduce((sum: number, c: any) => sum + Number(c.lifetimeValue ?? 0), 0) / Math.max(custs.reduce((sum: number, c: any) => sum + (c.totalOrders ?? 0), 0), 1) : 0,
    }));

    return NextResponse.json({ segments, summary, totalCustomers: customers.length });
  } catch (error: any) {
    return serverError(error);
  }
}
