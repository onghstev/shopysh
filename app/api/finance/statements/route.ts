export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError, toNumber } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'profit_loss'; // profit_loss, cash_flow

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const hasDateFilter = from || to;

    // Income by category
    const incomeWhere: any = { tenantId };
    if (hasDateFilter) incomeWhere.date = dateFilter;

    const incomes = await prisma.income.groupBy({
      by: ['category'],
      where: incomeWhere,
      _sum: { amount: true },
      _count: true,
    });

    const totalIncome = incomes.reduce((sum: number, i: any) => sum + toNumber(i._sum.amount), 0);

    // Expenses by category
    const expenseWhere: any = { tenantId };
    if (hasDateFilter) expenseWhere.date = dateFilter;

    const expensesRaw = await prisma.expense.findMany({
      where: expenseWhere,
      include: { category: { select: { name: true } } },
    });

    const expensesByCategory: Record<string, { total: number; count: number }> = {};
    let totalExpenses = 0;
    expensesRaw.forEach((e: any) => {
      const catName = e.category?.name || 'Uncategorized';
      if (!expensesByCategory[catName]) expensesByCategory[catName] = { total: 0, count: 0 };
      const amt = toNumber(e.amount);
      expensesByCategory[catName].total += amt;
      expensesByCategory[catName].count += 1;
      totalExpenses += amt;
    });

    // Order revenue
    const orderWhere: any = { tenantId, paymentStatus: 'PAID' };
    if (hasDateFilter) orderWhere.createdAt = dateFilter;
    const orderRevenue = await prisma.order.aggregate({ where: orderWhere, _sum: { totalAmount: true } });

    // Daily banking summaries
    const bankingWhere: any = { tenantId };
    if (hasDateFilter) bankingWhere.date = dateFilter;
    const cashSales = await prisma.dailyCashEntry.aggregate({ where: { ...bankingWhere, entryType: 'cash_sale' }, _sum: { amount: true } });
    const bankDeposits = await prisma.dailyCashEntry.aggregate({ where: { ...bankingWhere, entryType: 'bank_deposit' }, _sum: { amount: true } });

    const netProfit = totalIncome - totalExpenses;

    return NextResponse.json({
      type,
      period: { from: from || 'all-time', to: to || 'present' },
      income: {
        total: totalIncome,
        byCategory: incomes.map((i: any) => ({ category: i.category, total: toNumber(i._sum.amount), count: i._count })),
      },
      expenses: {
        total: totalExpenses,
        byCategory: Object.entries(expensesByCategory).map(([name, data]) => ({ category: name, ...data })),
      },
      orderRevenue: toNumber(orderRevenue._sum.totalAmount),
      cashSalesTotal: toNumber(cashSales._sum.amount),
      bankDepositsTotal: toNumber(bankDeposits._sum.amount),
      netProfit,
      profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0',
    });
  } catch (e) { return serverError(e); }
}
