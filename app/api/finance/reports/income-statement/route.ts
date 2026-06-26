export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(new Date().getFullYear(), 0, 1);
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date();

    // Get all INCOME and EXPENSE accounts
    const accounts = await prisma.glAccount.findMany({
      where: { tenantId, isActive: true, accountType: { in: ['INCOME', 'EXPENSE'] } },
      orderBy: { code: 'asc' },
    });

    const lines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } },
      _sum: { debit: true, credit: true },
    });
    const balMap = new Map(lines.map(l => [l.accountId, { debit: Number(l._sum.debit ?? 0), credit: Number(l._sum.credit ?? 0) }]));

    const revenue: any[] = [];
    const cogs: any[] = [];
    const opex: any[] = [];

    for (const acc of accounts) {
      const b = balMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const amount = acc.accountType === 'INCOME'
        ? b.credit - b.debit  // revenue: credit-normal
        : b.debit - b.credit; // expense: debit-normal

      if (amount === 0) continue;

      const row = { id: acc.id, code: acc.code, name: acc.name, amount, parentId: acc.parentId, level: acc.level };

      if (acc.accountType === 'INCOME') {
        revenue.push(row);
      } else if (acc.code.startsWith('5')) {
        cogs.push(row);
      } else {
        opex.push(row);
      }
    }

    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
    const totalCOGS = cogs.reduce((s, r) => s + r.amount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalOpex = opex.reduce((s, r) => s + r.amount, 0);
    const netProfit = grossProfit - totalOpex;

    return NextResponse.json({
      revenue, cogs, opex,
      summary: {
        totalRevenue, totalCOGS, grossProfit,
        grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        totalOpex, netProfit,
        netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      },
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
