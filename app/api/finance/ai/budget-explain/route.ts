export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { explainBudgetVariance } from '@/lib/ai-finance';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { accountId, accountName, budgeted, actual, variance, variancePct } = await req.json();
    if (!accountName || budgeted == null || actual == null) return badRequest('accountName, budgeted, actual required');

    // Fetch recent transactions for this account to give the LLM context
    let topTransactions: Array<{ date: string; description: string; amount: number }> = [];
    if (accountId) {
      const lines = await prisma.journalLine.findMany({
        where: {
          accountId,
          journalEntry: { tenantId, status: 'POSTED' },
        },
        include: { journalEntry: { select: { entryDate: true, description: true } } },
        orderBy: { journalEntry: { entryDate: 'desc' } },
        take: 5,
      });
      topTransactions = lines.map(l => ({
        date:        new Date(l.journalEntry.entryDate).toISOString().slice(0, 10),
        description: l.journalEntry.description,
        amount:      Number(l.debit) > 0 ? Number(l.debit) : Number(l.credit),
      }));
    }

    const explanation = await explainBudgetVariance({
      accountName,
      budgeted:    Number(budgeted),
      actual:      Number(actual),
      variance:    Number(variance ?? (actual - budgeted)),
      variancePct: Number(variancePct ?? ((actual - budgeted) / budgeted * 100)),
      topTransactions,
    });

    return NextResponse.json({ explanation });
  } catch (e) { return serverError(e); }
}
