export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, serverError, notFound } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

type Params = { params: { id: string } };

/** PATCH: match/unmatch/ignore a bank statement line */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const body = await req.json();
    const { lineId, action, matchedEntryId } = body;

    // Verify statement belongs to tenant
    const statement = await prisma.bankStatement.findFirst({ where: { id: params.id, tenantId } });
    if (!statement) return notFound();

    if (action === 'match' && matchedEntryId) {
      const line = await prisma.bankStatementLine.update({
        where: { id: lineId },
        data: { isMatched: true, matchedEntryId, isIgnored: false },
      });
      return NextResponse.json(line);
    }

    if (action === 'unmatch') {
      const line = await prisma.bankStatementLine.update({
        where: { id: lineId },
        data: { isMatched: false, matchedEntryId: null },
      });
      return NextResponse.json(line);
    }

    if (action === 'ignore') {
      const line = await prisma.bankStatementLine.update({
        where: { id: lineId },
        data: { isIgnored: true, isMatched: false, matchedEntryId: null },
      });
      return NextResponse.json(line);
    }

    if (action === 'complete') {
      const updated = await prisma.bankStatement.update({
        where: { id: params.id },
        data: { status: 'reconciled' },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    const statement = await prisma.bankStatement.findFirst({ where: { id: params.id, tenantId } });
    if (!statement) return notFound();

    await prisma.bankStatement.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) { return serverError(e); }
}
