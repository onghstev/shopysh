export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

/** Ensure the tenant has a current fiscal year; create one if not. */
async function ensureFiscalYear(tenantId: string) {
  let fy = await prisma.fiscalYear.findFirst({
    where: { tenantId, isDefault: true },
    orderBy: { startDate: 'desc' },
  });
  if (!fy) {
    const year = new Date().getFullYear();
    fy = await prisma.fiscalYear.create({
      data: {
        tenantId,
        name:      `FY ${year}`,
        startDate: new Date(`${year}-01-01`),
        endDate:   new Date(`${year}-12-31`),
        status:    'OPEN',
        isDefault: true,
      },
    });
  }
  return fy;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const fyId = searchParams.get('fiscalYearId');

    const fiscalYears = await prisma.fiscalYear.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, startDate: true, endDate: true, status: true, isDefault: true },
    });

    const targetFyId = fyId ?? fiscalYears.find(f => f.isDefault)?.id ?? fiscalYears[0]?.id;
    if (!targetFyId) {
      return NextResponse.json({ budgets: [], fiscalYears: [] });
    }

    const budgets = await prisma.budget.findMany({
      where: { tenantId, fiscalYearId: targetFyId },
      include: {
        lines: {
          include: { budget: false },
          orderBy: { periodNumber: 'asc' },
        },
        fiscalYear: { select: { id: true, name: true, startDate: true, endDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each budget, enrich lines with account details and actual spending
    const enriched = await Promise.all(budgets.map(async (b) => {
      const accountIds = [...new Set(b.lines.map(l => l.accountId))];
      const accounts = await prisma.glAccount.findMany({
        where: { id: { in: accountIds } },
        select: { id: true, code: true, name: true, accountType: true },
      });
      const accMap = new Map(accounts.map(a => [a.id, a]));

      const fy = b.fiscalYear;
      // Get actuals for each account (YTD within fiscal year)
      const actuals = await Promise.all(accountIds.map(async (accId) => {
        const agg = await prisma.journalLine.aggregate({
          where: {
            accountId: accId,
            journalEntry: {
              tenantId,
              status: 'POSTED',
              entryDate: { gte: fy.startDate, lte: new Date() },
            },
          },
          _sum: { debit: true, credit: true },
        });
        const acc = accMap.get(accId);
        const d = Number(agg._sum.debit ?? 0);
        const c = Number(agg._sum.credit ?? 0);
        // For expense accounts, actual = net debit; for income, net credit
        const actual = acc?.accountType === 'INCOME' ? c - d : d - c;
        return { accountId: accId, actual };
      }));
      const actualMap = new Map(actuals.map(a => [a.accountId, a.actual]));

      // Group lines by account + compute totals
      const byAccount: Record<string, { account: any; budgeted: number; actual: number }> = {};
      for (const line of b.lines) {
        if (!byAccount[line.accountId]) {
          byAccount[line.accountId] = {
            account:  accMap.get(line.accountId) ?? { id: line.accountId, code: '', name: 'Unknown' },
            budgeted: 0,
            actual:   actualMap.get(line.accountId) ?? 0,
          };
        }
        byAccount[line.accountId].budgeted += Number(line.budgeted);
      }

      return {
        ...b,
        lines: undefined,
        linesByAccount: Object.values(byAccount),
        totalBudgeted:  Object.values(byAccount).reduce((s, v) => s + v.budgeted, 0),
        totalActual:    Object.values(byAccount).reduce((s, v) => s + v.actual,   0),
      };
    }));

    return NextResponse.json({ budgets: enriched, fiscalYears, currentFyId: targetFyId });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { name, description, fiscalYearId, currency, lines } = body;

    if (!name) return badRequest('Budget name is required');
    if (!lines || lines.length === 0) return badRequest('At least one budget line is required');

    const fy = fiscalYearId
      ? await prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, tenantId } })
      : await ensureFiscalYear(tenantId);

    if (!fy) return badRequest('Fiscal year not found');

    const budget = await prisma.budget.create({
      data: {
        tenantId,
        fiscalYearId: fy.id,
        name,
        description: description || null,
        currency:    currency || 'NGN',
        status:      'active',
        lines: {
          create: lines.map((l: any) => ({
            accountId:    l.accountId,
            periodNumber: l.periodNumber ?? 0,
            budgeted:     Number(l.budgeted),
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (e) { return serverError(e); }
}
