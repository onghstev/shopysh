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
    const from = searchParams.get('from') ?? `${new Date().getFullYear()}-01-01`;
    const to   = searchParams.get('to')   ?? new Date().toISOString().slice(0, 10);

    const fromDate = new Date(from);
    const toDate   = new Date(to + 'T23:59:59');

    // Output VAT (code 2200 or systemTag VAT_OUTPUT)
    const vatOutputAcc = await prisma.glAccount.findFirst({
      where: { tenantId, OR: [{ systemTag: 'VAT_OUTPUT' }, { code: '2200' }] },
      select: { id: true, name: true, code: true },
    });

    // Input VAT (code 1600 or systemTag VAT_INPUT)
    const vatInputAcc = await prisma.glAccount.findFirst({
      where: { tenantId, OR: [{ systemTag: 'VAT_INPUT' }, { code: '1600' }] },
      select: { id: true, name: true, code: true },
    });

    async function getMonthlyBreakdown(accountId: string, normal: 'credit' | 'debit') {
      const lines = await prisma.journalLine.findMany({
        where: {
          accountId,
          journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: fromDate, lte: toDate } },
        },
        include: {
          journalEntry: { select: { entryDate: true, description: true, entryNumber: true } },
        },
        orderBy: { journalEntry: { entryDate: 'asc' } },
      });

      const monthly: Record<string, number> = {};
      const entries: any[] = [];

      for (const l of lines) {
        const d  = Number(l.debit ?? 0);
        const cr = Number(l.credit ?? 0);
        const net = normal === 'credit' ? cr - d : d - cr;
        const month = new Date(l.journalEntry.entryDate).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
        monthly[month] = (monthly[month] ?? 0) + net;
        entries.push({
          date:        l.journalEntry.entryDate,
          entryNumber: l.journalEntry.entryNumber,
          description: l.journalEntry.description,
          amount:      net,
        });
      }

      return { monthly, entries, total: Object.values(monthly).reduce((s, v) => s + v, 0) };
    }

    const outputVAT = vatOutputAcc
      ? await getMonthlyBreakdown(vatOutputAcc.id, 'credit')
      : { monthly: {}, entries: [], total: 0 };

    const inputVAT = vatInputAcc
      ? await getMonthlyBreakdown(vatInputAcc.id, 'debit')
      : { monthly: {}, entries: [], total: 0 };

    const vatPayable = outputVAT.total - inputVAT.total;

    // Collect all unique months across both
    const allMonths = Array.from(new Set([
      ...Object.keys(outputVAT.monthly),
      ...Object.keys(inputVAT.monthly),
    ]));

    const monthly = allMonths.map(m => ({
      month:     m,
      outputVAT: outputVAT.monthly[m] ?? 0,
      inputVAT:  inputVAT.monthly[m]  ?? 0,
      netVAT:    (outputVAT.monthly[m] ?? 0) - (inputVAT.monthly[m] ?? 0),
    }));

    return NextResponse.json({
      from, to,
      outputVAT:  { account: vatOutputAcc, total: outputVAT.total, entries: outputVAT.entries },
      inputVAT:   { account: vatInputAcc,  total: inputVAT.total,  entries: inputVAT.entries  },
      vatPayable,
      monthly,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
