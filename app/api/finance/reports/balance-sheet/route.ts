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
    const asOf = searchParams.get('asOf') ? new Date(searchParams.get('asOf')!) : new Date();

    const accounts = await prisma.glAccount.findMany({
      where: { tenantId, isActive: true, accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] } },
      orderBy: { code: 'asc' },
    });

    const lines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { journalEntry: { tenantId, status: 'POSTED', entryDate: { lte: asOf } } },
      _sum: { debit: true, credit: true },
    });
    const balMap = new Map(lines.map(l => [l.accountId, { debit: Number(l._sum.debit ?? 0), credit: Number(l._sum.credit ?? 0) }]));

    // Also compute net income from income/expense accounts up to asOf
    const ieLines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { journalEntry: { tenantId, status: 'POSTED', entryDate: { lte: asOf } } },
      _sum: { debit: true, credit: true },
    });
    const ieAccounts = await prisma.glAccount.findMany({
      where: { tenantId, isActive: true, accountType: { in: ['INCOME', 'EXPENSE'] } },
      select: { id: true, accountType: true },
    });
    const ieTypeMap = new Map(ieAccounts.map(a => [a.id, a.accountType]));
    let retainedNetIncome = 0;
    for (const l of ieLines) {
      const type = ieTypeMap.get(l.accountId);
      if (!type) continue;
      const d = Number(l._sum.debit ?? 0);
      const c = Number(l._sum.credit ?? 0);
      if (type === 'INCOME') retainedNetIncome += c - d;
      if (type === 'EXPENSE') retainedNetIncome -= d - c;
    }

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    for (const acc of accounts) {
      const b = balMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const opening = Number(acc.openingBalance);
      const balance =
        acc.accountType === 'ASSET'
          ? opening + b.debit - b.credit
          : opening + b.credit - b.debit;

      if (balance === 0) continue;
      const row = { id: acc.id, code: acc.code, name: acc.name, balance, parentId: acc.parentId, level: acc.level };
      if (acc.accountType === 'ASSET') assets.push(row);
      else if (acc.accountType === 'LIABILITY') liabilities.push(row);
      else equity.push(row);
    }

    const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + r.balance, 0);
    const totalEquity = equity.reduce((s, r) => s + r.balance, 0);
    const totalLiabEquity = totalLiabilities + totalEquity + retainedNetIncome;

    return NextResponse.json({
      assets, liabilities, equity,
      summary: {
        totalAssets, totalLiabilities, totalEquity,
        retainedNetIncome, totalLiabEquity,
        isBalanced: Math.abs(totalAssets - totalLiabEquity) < 0.01,
      },
      asOf: asOf.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
