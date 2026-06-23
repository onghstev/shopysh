export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await req.json();
    if (body.balance) body.balance = parseFloat(body.balance);
    const result = await prisma.bankAccount.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data: body });
    if (result.count === 0) return notFound('Account not found');
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    await prisma.bankAccount.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}
