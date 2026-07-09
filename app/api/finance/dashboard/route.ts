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

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // All posted lines this year, grouped by account type
    const yearLines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: yearStart, lte: now } } },
      _sum: { debit: true, credit: true },
    });

    // Get account types for the accounts in year lines
    const accountIds = yearLines.map(l => l.accountId);
    const accountTypes = accountIds.length > 0
      ? await prisma.glAccount.findMany({ where: { id: { in: accountIds } }, select: { id: true, accountType: true, openingBalance: true } })
      : [];
    const accountTypeMap = new Map(accountTypes.map(a => [a.id, a]));

    let totalRevenue = 0, totalExpenses = 0, totalAssets = 0, totalLiabilities = 0;
    for (const line of yearLines) {
      const acc = accountTypeMap.get(line.accountId);
      if (!acc) continue;
      const d = Number(line._sum.debit ?? 0);
      const c = Number(line._sum.credit ?? 0);
      if (acc.accountType === 'INCOME') totalRevenue += c - d;
      if (acc.accountType === 'EXPENSE') totalExpenses += d - c;
    }

    // Cash balance (system tag CASH + BANK)
    const cashAccounts = await prisma.glAccount.findMany({
      where: { tenantId, systemTag: { in: ['CASH', 'BANK'] }, isActive: true },
      select: { id: true, openingBalance: true, accountType: true },
    });
    let cashBalance = 0;
    for (const ca of cashAccounts) {
      const agg = await prisma.journalLine.aggregate({
        where: { accountId: ca.id, journalEntry: { status: 'POSTED' } },
        _sum: { debit: true, credit: true },
      });
      cashBalance += Number(ca.openingBalance) + Number(agg._sum.debit ?? 0) - Number(agg._sum.credit ?? 0);
    }

    // AR balance
    const arAccount = await prisma.glAccount.findFirst({ where: { tenantId, systemTag: 'AR' }, select: { id: true, openingBalance: true } });
    let arBalance = 0;
    if (arAccount) {
      const agg = await prisma.journalLine.aggregate({
        where: { accountId: arAccount.id, journalEntry: { status: 'POSTED' } },
        _sum: { debit: true, credit: true },
      });
      arBalance = Number(arAccount.openingBalance) + Number(agg._sum.debit ?? 0) - Number(agg._sum.credit ?? 0);
    }

    // AP balance
    const apAccount = await prisma.glAccount.findFirst({ where: { tenantId, systemTag: 'AP' }, select: { id: true, openingBalance: true } });
    let apBalance = 0;
    if (apAccount) {
      const agg = await prisma.journalLine.aggregate({
        where: { accountId: apAccount.id, journalEntry: { status: 'POSTED' } },
        _sum: { debit: true, credit: true },
      });
      apBalance = Number(apAccount.openingBalance) + Number(agg._sum.credit ?? 0) - Number(agg._sum.debit ?? 0);
    }

    // Monthly revenue trend (last 6 months)
    const trend: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const mLabel = mStart.toLocaleString('default', { month: 'short', year: '2-digit' });

      const mLines = await prisma.journalLine.groupBy({
        by: ['accountId'],
        where: { journalEntry: { tenantId, status: 'POSTED', entryDate: { gte: mStart, lte: mEnd } } },
        _sum: { debit: true, credit: true },
      });

      let mRev = 0, mExp = 0;
      for (const ml of mLines) {
        const acc = accountTypeMap.get(ml.accountId);
        if (!acc) continue;
        const d = Number(ml._sum.debit ?? 0);
        const c = Number(ml._sum.credit ?? 0);
        if (acc.accountType === 'INCOME') mRev += c - d;
        if (acc.accountType === 'EXPENSE') mExp += d - c;
      }
      trend.push({ month: mLabel, revenue: mRev, expenses: mExp });
    }

    // Recent journal entries
    const recentJournals = await prisma.journalEntry.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, entryNumber: true, entryDate: true, description: true,
        status: true, entryType: true, totalDebit: true,
      },
    });

    // Counts
    const [draftCount, accountCount, vendorCount] = await Promise.all([
      prisma.journalEntry.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.glAccount.count({ where: { tenantId, isActive: true } }),
      prisma.vendor.count({ where: { tenantId, isActive: true, deletedAt: null } }),
    ]);

    // Fixed assets summary
    const activeAssets = await prisma.fixedAsset.findMany({
      where: { tenantId, status: 'active', deletedAt: null },
      select: { bookValue: true },
    });
    const fixedAssetsNetBook = activeAssets.reduce((s, a) => s + Number(a.bookValue), 0);

    // Overdue receivables (invoices unpaid > 30 days) from purchase invoices / sales book
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
        dueDate: { lt: thirtyDaysAgo },
      },
      select: { totalAmount: true },
    });
    const overdueAR = {
      count: overdueInvoices.length,
      amount: overdueInvoices.reduce((s, i) => s + Number(i.totalAmount), 0),
    };

    return NextResponse.json({
      kpis: {
        totalRevenue, totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        cashBalance, arBalance, apBalance,
        fixedAssetsNetBook,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      },
      trend,
      recentJournals,
      overdueAR,
      counts: {
        draftJournals: draftCount, accounts: accountCount, vendors: vendorCount,
        fixedAssets: activeAssets.length,
      },
    });
  } catch (e: any) {
    console.error('GET /api/finance/dashboard', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
