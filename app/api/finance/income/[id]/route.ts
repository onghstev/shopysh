export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const income = await prisma.income.findFirst({ where: { id: params.id, tenantId: session.user.tenantId }, include: { customer: { select: { id: true, name: true } } } });
    if (!income) return notFound('Income not found');
    return NextResponse.json(income);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await req.json();
    const income = await prisma.income.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data: { ...body, amount: body.amount ? parseFloat(body.amount) : undefined, date: body.date ? new Date(body.date) : undefined } });
    if (income.count === 0) return notFound('Income not found');
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    await prisma.income.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } });
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}
