export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await req.json();
    if (body.amount) body.amount = parseFloat(body.amount);
    if (body.date) body.date = new Date(body.date);
    if (body.openingBalance) body.openingBalance = parseFloat(body.openingBalance);
    if (body.closingBalance) body.closingBalance = parseFloat(body.closingBalance);
    if (body.expectedBalance) body.expectedBalance = parseFloat(body.expectedBalance);
    if (body.closingBalance != null && body.expectedBalance != null) {
      body.variance = parseFloat(body.closingBalance) - parseFloat(body.expectedBalance);
    }
    const result = await prisma.dailyCashEntry.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data: body });
    if (result.count === 0) return notFound('Entry not found');
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    await prisma.dailyCashEntry.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } });
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}
