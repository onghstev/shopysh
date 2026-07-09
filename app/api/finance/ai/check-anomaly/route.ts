export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { detectAnomalies } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { lines, entryDate, totalAmount } = await req.json();
    if (!lines || !entryDate || !totalAmount) return badRequest('lines, entryDate, totalAmount required');

    // Compute monthly average for context
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const agg = await prisma.journalEntry.aggregate({
      where: { tenantId, status: 'POSTED', entryDate: { gte: ninetyDaysAgo } },
      _avg: { totalDebit: true },
      _count: { id: true },
    });
    const monthlyAverage = agg._count.id > 0
      ? Number(agg._avg.totalDebit ?? 0) * (agg._count.id / 3)
      : undefined;

    const anomalies = detectAnomalies({ lines, entryDate, totalAmount: Number(totalAmount), monthlyAverage });
    return NextResponse.json({ anomalies });
  } catch (e) { return serverError(e); }
}
