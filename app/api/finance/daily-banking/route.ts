export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const entryType = searchParams.get('entryType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '30');

    const where: any = { tenantId };
    if (entryType) where.entryType = entryType;
    if (status) where.status = status;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      prisma.dailyCashEntry.findMany({
        where,
        include: { bankAccount: { select: { id: true, bankName: true, accountNumber: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dailyCashEntry.count({ where }),
    ]);

    // Aggregate summaries
    const cashSalesTotal = await prisma.dailyCashEntry.aggregate({ where: { ...where, entryType: 'cash_sale' }, _sum: { amount: true } });
    const depositsTotal = await prisma.dailyCashEntry.aggregate({ where: { ...where, entryType: 'bank_deposit' }, _sum: { amount: true } });

    return NextResponse.json({
      items, total, page, pageSize,
      cashSalesTotal: cashSalesTotal._sum.amount || 0,
      depositsTotal: depositsTotal._sum.amount || 0,
    });
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;
    const body = await req.json();
    const { entryType, description, amount, date, bankAccountId, openingBalance, closingBalance, expectedBalance, reference, notes, status } = body;

    if (!entryType || !description || !amount || !date) return badRequest('Entry type, description, amount and date are required');

    let variance = null;
    if (expectedBalance != null && closingBalance != null) {
      variance = parseFloat(closingBalance) - parseFloat(expectedBalance);
    }

    const entry = await prisma.dailyCashEntry.create({
      data: {
        tenantId,
        entryType,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        bankAccountId: bankAccountId || null,
        openingBalance: openingBalance != null ? parseFloat(openingBalance) : null,
        closingBalance: closingBalance != null ? parseFloat(closingBalance) : null,
        expectedBalance: expectedBalance != null ? parseFloat(expectedBalance) : null,
        variance,
        reference: reference || null,
        notes: notes || null,
        status: status || 'pending',
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) { return serverError(e); }
}
