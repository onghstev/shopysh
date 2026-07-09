export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { projectCashFlow } from '@/lib/ai-finance';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const days = Number(new URL(req.url).searchParams.get('days') ?? 90);

    // Get current cash balance (CASH + BANK accounts)
    const cashAccounts = await prisma.glAccount.findMany({
      where: { tenantId, systemTag: { in: ['CASH', 'BANK'] } },
      select: { id: true },
    });
    const cashAccountIds = cashAccounts.map(a => a.id);

    let currentCashBalance = 0;
    if (cashAccountIds.length > 0) {
      const agg = await prisma.journalLine.aggregate({
        where: { accountId: { in: cashAccountIds }, journalEntry: { tenantId, status: 'POSTED' } },
        _sum: { debit: true, credit: true },
      });
      currentCashBalance = Number(agg._sum.debit ?? 0) - Number(agg._sum.credit ?? 0);
    }

    // Compute 3-month average inflows and outflows
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const receipts = await prisma.journalEntry.aggregate({
      where: { tenantId, status: 'POSTED', entryType: { in: ['CASH_RECEIPT', 'SALES_RECEIPT'] }, entryDate: { gte: threeMonthsAgo } },
      _sum: { totalCredit: true },
    });
    const payments = await prisma.journalEntry.aggregate({
      where: { tenantId, status: 'POSTED', entryType: { in: ['CASH_PAYMENT', 'PURCHASE_PAYMENT'] }, entryDate: { gte: threeMonthsAgo } },
      _sum: { totalDebit: true },
    });

    const monthlyInflows  = Number(receipts._sum.totalCredit ?? 0) / 3;
    const monthlyOutflows = Number(payments._sum.totalDebit  ?? 0) / 3;

    // Get upcoming recurring journal items as cash flow events
    const upcoming = await prisma.recurringJournal.findMany({
      where: { tenantId, isActive: true },
      select: { name: true, nextRunDate: true, lines: { select: { debit: true, credit: true } } },
    });

    const recurringItems = upcoming.map(rj => {
      const totalDebit  = rj.lines.reduce((s, l) => s + Number(l.debit), 0);
      const totalCredit = rj.lines.reduce((s, l) => s + Number(l.credit), 0);
      const isInflow    = totalCredit > totalDebit;
      return {
        name:     rj.name,
        amount:   Math.max(totalDebit, totalCredit),
        nextDate: new Date(rj.nextRunDate).toISOString().slice(0, 10),
        isInflow,
      };
    });

    const forecast = projectCashFlow({ currentCashBalance, monthlyInflows, monthlyOutflows, recurringItems, forecastDays: days });

    return NextResponse.json({
      currentCashBalance,
      monthlyInflows,
      monthlyOutflows,
      ...forecast,
    });
  } catch (e) { return serverError(e); }
}
