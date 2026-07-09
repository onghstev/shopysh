export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const SALES_TYPES = ['SALES_INVOICE', 'SALES_RECEIPT', 'CREDIT_NOTE'];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const from = searchParams.get('from') ?? defaultFrom;
    const to = searchParams.get('to') ?? defaultTo;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));

    const where: any = {
      tenantId,
      entryType: { in: SALES_TYPES },
      status: 'POSTED',
      entryDate: { gte: new Date(from), lte: new Date(to + 'T23:59:59Z') },
    };

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ entryDate: 'desc' }, { entryNumber: 'asc' }],
        include: {
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true, systemTag: true, accountType: true } },
              customer: { select: { id: true, name: true, phone: true, email: true, customerCode: true } },
            },
          },
        },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    // Compute aggregates
    const agg = await prisma.journalEntry.aggregate({
      where,
      _sum: { totalDebit: true, totalCredit: true },
    });

    return NextResponse.json({
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totals: {
        totalDebit: Number(agg._sum.totalDebit ?? 0),
        totalCredit: Number(agg._sum.totalCredit ?? 0),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
