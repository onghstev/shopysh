export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

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
    await prisma.expense.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } });
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}
