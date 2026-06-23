export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorized, notFound, serverError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: { customer: { select: { id: true, name: true, phone: true, email: true, location: true } } },
    });
    if (!invoice) return notFound('Invoice not found');
    return NextResponse.json(invoice);
  } catch (e) { return serverError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    const body = await req.json();
    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'paid') updateData.paidAt = new Date();
    }
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.totalAmount) updateData.totalAmount = parseFloat(body.totalAmount);
    if (body.subtotal) updateData.subtotal = parseFloat(body.subtotal);
    if (body.taxAmount !== undefined) updateData.taxAmount = parseFloat(body.taxAmount);
    if (body.discountAmount !== undefined) updateData.discountAmount = parseFloat(body.discountAmount);

    const result = await prisma.invoice.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data: updateData });
    if (result.count === 0) return notFound('Invoice not found');
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.tenantId) return unauthorized();
    await prisma.invoice.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } });
    return NextResponse.json({ success: true });
  } catch (e) { return serverError(e); }
}
