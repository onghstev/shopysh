export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { writeAuditLog } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await req.json();
    const result = await prisma.expense.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data: { ...body, amount: body.amount ? parseFloat(body.amount) : undefined, date: body.date ? new Date(body.date) : undefined } });
    if (result.count === 0) return notFound('Expense not found');
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const tenantId = session.user.tenantId;

    // Delete linked DRAFT journal entry first (if one exists)
    const linkedJe = await prisma.journalEntry.findFirst({
      where: { tenantId, sourceType: 'EXPENSE', sourceId: params.id, status: 'DRAFT' },
      select: { id: true },
    });
    if (linkedJe) {
      await prisma.journalEntry.delete({ where: { id: linkedJe.id } });
    }

    const expense = await prisma.expense.findFirst({ where: { id: params.id, tenantId }, select: { description: true, amount: true } });
    await prisma.expense.deleteMany({ where: { id: params.id, tenantId } });

    if (expense) {
      writeAuditLog({
        tenantId, userId: session.user.id,
        userName: session.user.name ?? session.user.email ?? undefined,
        action: 'EXPENSE_DELETED', entity: 'Expense', entityId: params.id,
        summary: `Expense deleted: ${expense.description} – ${expense.amount}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}
