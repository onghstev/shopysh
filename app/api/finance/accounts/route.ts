export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { ensureDefaultAccounts } from '@/lib/accounting/defaults';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    // Auto-seed default accounts on first visit
    await ensureDefaultAccounts(tenantId);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');
    const search = searchParams.get('search');
    const withBalance = searchParams.get('withBalance') === 'true';

    const accounts = await prisma.glAccount.findMany({
      where: {
        tenantId,
        ...(type ? { accountType: type as any } : {}),
        ...(parentId === 'null' ? { parentId: null } : parentId ? { parentId } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] } : {}),
        isActive: true,
      },
      orderBy: [{ code: 'asc' }],
      include: { _count: { select: { children: true } } },
    });

    if (!withBalance) return NextResponse.json({ accounts });

    // Compute balances from posted journal lines
    const lineAgg = await prisma.journalLine.groupBy({
      by: ['accountId'],
      where: { journalEntry: { tenantId, status: 'POSTED' } },
      _sum: { debit: true, credit: true },
    });
    const balMap = new Map(lineAgg.map(l => [l.accountId, { debit: Number(l._sum.debit ?? 0), credit: Number(l._sum.credit ?? 0) }]));

    const withBalances = accounts.map(a => {
      const b = balMap.get(a.id) ?? { debit: 0, credit: 0 };
      const opening = Number(a.openingBalance);
      const balance =
        a.accountType === 'ASSET' || a.accountType === 'EXPENSE'
          ? opening + b.debit - b.credit
          : opening + b.credit - b.debit;
      return { ...a, balance, totalDebit: b.debit, totalCredit: b.credit };
    });

    return NextResponse.json({ accounts: withBalances });
  } catch (e: any) {
    console.error('GET /api/finance/accounts', e);
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { code, name, accountType, accountSubtype, parentId, description, currency, openingBalance } = body;

    if (!code || !name || !accountType) {
      return NextResponse.json({ error: 'code, name, and accountType are required' }, { status: 400 });
    }

    const conflict = await prisma.glAccount.findUnique({ where: { tenantId_code: { tenantId, code } } });
    if (conflict) return NextResponse.json({ error: `Account code ${code} already exists` }, { status: 409 });

    let level = 1;
    if (parentId) {
      const parent = await prisma.glAccount.findUnique({ where: { id: parentId }, select: { level: true } });
      if (parent) level = parent.level + 1;
    }

    const account = await prisma.glAccount.create({
      data: {
        tenantId, code, name, accountType, accountSubtype: accountSubtype ?? null,
        parentId: parentId ?? null, level, description: description ?? null,
        currency: currency ?? 'NGN',
        openingBalance: openingBalance ? parseFloat(openingBalance) : 0,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/finance/accounts', e);
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}
