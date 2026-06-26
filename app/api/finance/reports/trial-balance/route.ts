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

    const accounts = await prisma.glAccount.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const lines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: from, lte: to } } },
      _sum: { debit: true, credit: true },
    });

    const balMap = new Map(lines.map(l => [l.accountId, { debit: Number(l._sum.debit ?? 0), credit: Number(l._sum.credit ?? 0) }]));

    const rows = accounts.map(acc => {
      const b = balMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const opening = Number(acc.openingBalance);
      const isDebitNormal = acc.accountType === 'ASSET' || acc.accountType === 'EXPENSE';
      const balance = isDebitNormal ? opening + b.debit - b.credit : opening + b.credit - b.debit;

      return {
        id: acc.id, code: acc.code, name: acc.name,
        accountType: acc.accountType, level: acc.level, parentId: acc.parentId,
        periodDebit: b.debit, periodCredit: b.credit, openingBalance: opening,
        closingBalance: balance,
        debitBalance: isDebitNormal && balance > 0 ? balance : (isDebitNormal ? 0 : (balance < 0 ? -balance : 0)),
        creditBalance: !isDebitNormal && balance > 0 ? balance : (!isDebitNormal ? 0 : (balance < 0 ? -balance : 0)),
      };
    }).filter(r => r.periodDebit !== 0 || r.periodCredit !== 0 || r.openingBalance !== 0);

    const totals = rows.reduce((acc, r) => ({
      debit: acc.debit + r.periodDebit,
      credit: acc.credit + r.periodCredit,
      debitBalance: acc.debitBalance + r.debitBalance,
      creditBalance: acc.creditBalance + r.creditBalance,
    }), { debit: 0, credit: 0, debitBalance: 0, creditBalance: 0 });

    return NextResponse.json({ rows, totals, from: from.toISOString(), to: to.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
