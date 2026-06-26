export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createJournalEntry, AccountingError } from '@/lib/accounting/engine';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') ?? '20'));
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const search = searchParams.get('search');

    const where: any = {
      tenantId,
      ...(status ? { status: status as any } : {}),
      ...(type ? { entryType: type as any } : {}),
      ...(from || to ? { entryDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      ...(search ? { OR: [{ description: { contains: search, mode: 'insensitive' } }, { entryNumber: { contains: search, mode: 'insensitive' } }, { reference: { contains: search, mode: 'insensitive' } }] } : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
        include: { _count: { select: { lines: true } } },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { entryDate, description, entryType, reference, currency, notes, sourceType, sourceId, lines } = body;

    if (!entryDate || !description || !entryType) {
      return NextResponse.json({ error: 'entryDate, description, and entryType are required' }, { status: 400 });
    }
    if (!Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json({ error: 'At least 2 journal lines are required' }, { status: 400 });
    }

    const entry = await createJournalEntry({
      tenantId,
      entryDate: new Date(entryDate),
      description, entryType, reference, currency,
      notes, sourceType, sourceId,
      createdById: session.user.id,
      lines: lines.map((l: any) => ({
        accountId: l.accountId,
        debit: l.debit ? parseFloat(l.debit) : undefined,
        credit: l.credit ? parseFloat(l.credit) : undefined,
        description: l.description,
        customerId: l.customerId,
        vendorId: l.vendorId,
      })),
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (e: any) {
    if (e instanceof AccountingError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}
